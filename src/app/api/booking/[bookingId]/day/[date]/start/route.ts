import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";

// 📌 Helper – get today (yyyy-mm-dd) in India timezone
function getTodayDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

// 📌 Helper – unified 200 response
function apiResponse(
  success: boolean,
  message: string,
  data: Record<string, any> = {}
) {
  return NextResponse.json(
    {
      success,
      message,
      data,
    },
    { status: 200 }
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;
    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return apiResponse(false, "bookingId, date & otp are required");
    }

    await connectDB();

    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return apiResponse(false, "Booking not found");
    }

    if (!booking.paid) {
      return apiResponse(false, "Payment not completed");
    }

    if (!booking.assignedInstructorId) {
      return apiResponse(false, "Instructor not assigned");
    }

    const day = booking.days.find((d: any) => d.date === date);
    if (!day) {
      return apiResponse(false, "No session scheduled for this date");
    }

    const today = getTodayDate();
    if (date !== today) {
      return apiResponse(false, "Session allowed only for today", {
        allowedDate: today,
      });
    }

    if (day.startOtp !== otp) {
      return apiResponse(false, "Invalid OTP");
    }

    if (day.status === "started") {
      return apiResponse(false, "Session already started");
    }

    if (day.status === "completed") {
      return apiResponse(false, "Session already completed");
    }

    // 🔥 START SESSION
    day.status = "started";
    day.startedAt = new Date();

    await booking.save();

    // -----------------------------------------------------------
    // 🔔 SEND NOTIFICATIONS
    // -----------------------------------------------------------

    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Session Started 🚗",
        `Your driving session for ${booking.bookingId} has started.`
      );
    }

    if (instructor?.fcmToken) {
      await sendPushNotification(
        instructor.fcmToken,
        "Training Started 👨‍🏫",
        `Session for booking ${booking.bookingId} has been started.`
      );
    }

    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Started 🔥",
        `Booking ${booking.bookingId} session started today.`
      );
    }

    // -----------------------------------------------------------

    return apiResponse(true, "Day session started", {
      bookingId: booking.bookingId || "",
      date: day.date || "",
      startedAt: day.startedAt || "",
    });
  } catch (error) {
    console.error("START DAY ERROR:", error);
    return apiResponse(false, "Server error");
  }
}
