import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User"; // ⬅ added to fetch user + instructor tokens
import { sendPushNotification } from "@/lib/sendNotification"; // ⬅ for notifications

// 📌 Helper – get today (yyyy-mm-dd) in India timezone
function getTodayDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;
    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date & otp are required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.paid) {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        { success: false, message: "Instructor not assigned" },
        { status: 400 }
      );
    }

    const day = booking.days.find((d: any) => d.date === date);
    if (!day) {
      return NextResponse.json(
        { success: false, message: "No session scheduled for this date" },
        { status: 404 }
      );
    }

    const today = getTodayDate();
    if (date !== today) {
      return NextResponse.json(
        {
          success: false,
          message: `Session allowed only for today. Today is ${today}`,
          allowedDate: today,
        },
        { status: 400 }
      );
    }

    if (day.startOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 401 }
      );
    }

    if (day.status === "started") {
      return NextResponse.json(
        { success: false, message: "Session already started" },
        { status: 400 }
      );
    }

    if (day.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Session already completed" },
        { status: 400 }
      );
    }

    // 🔥 START SESSION
    day.status = "started";
    day.startedAt = new Date();

    await booking.save();

    // -----------------------------------------------------------
    // 🔔 SEND NOTIFICATIONS (ONLY ADDED THIS)
    // -----------------------------------------------------------

    // Fetch User & Instructor tokens
    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    // Notify User
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Session Started 🚗",
        `Your driving session for ${booking.bookingId} has started.`
      );
    }

    // Notify Instructor
    if (instructor?.fcmToken) {
      await sendPushNotification(
        instructor.fcmToken,
        "Training Started 👨‍🏫",
        `Session for booking ${booking.bookingId} has been started.`
      );
    }

    // Notify Admin
    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Started 🔥",
        `Booking ${booking.bookingId} session started today.`
      );
    }

    // -----------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Day session started",
      data: {
        bookingId: booking.bookingId,
        date: day.date,
        startedAt: day.startedAt,
      },
    });
  } catch (err) {
    console.error("START DAY ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
