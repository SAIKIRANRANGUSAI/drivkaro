import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";

// 📌 Unified 200 response helper
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
      return apiResponse(false, "bookingId, date and otp are required");
    }

    await connectDB();

    // 1️⃣ Lookup booking
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

    if (!booking.paid || booking.status !== "ongoing") {
      return apiResponse(false, "Booking not active");
    }

    // 2️⃣ Locate Day
    const dayEntry = booking.days.find((d: any) => d.date === date);

    if (!dayEntry) {
      return apiResponse(false, "No schedule found for this date");
    }

    // 3️⃣ Validate START session
    if (dayEntry.status !== "started") {
      return apiResponse(false, "Start session not completed yet");
    }

    if (!dayEntry.startedAt) {
      return apiResponse(false, "Start OTP not verified");
    }

    // 4️⃣ Validate End OTP
    if (dayEntry.endOtp !== otp) {
      return apiResponse(false, "Invalid end OTP");
    }

    // 5️⃣ Update BookingDay collection
    let bookingDay = await BookingDay.findOne({
      booking: booking._id,
      date,
    });

    if (!bookingDay) {
      bookingDay = new BookingDay({
        booking: booking._id,
        date,
      });
    }

    bookingDay.endVerifiedAt = new Date();
    bookingDay.status = "completed";
    await bookingDay.save();

    // 6️⃣ Update embedded day entry
    dayEntry.status = "completed";
    dayEntry.completedAt = new Date();

    await booking.save();

    // 7️⃣ If all days completed → complete booking
    const allCompleted = booking.days.every(
      (d: any) => d.status === "completed"
    );

    if (allCompleted) {
      booking.status = "completed";
      booking.completedAt = new Date();
      await booking.save();
    }

    // --------------------------------------------------
    // 🔔 SEND NOTIFICATIONS
    // --------------------------------------------------

    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Session Completed 🎉",
        `Your driving session on ${date} is successfully completed.`
      );
    }

    if (instructor?.fcmToken) {
      await sendPushNotification(
        instructor.fcmToken,
        "User Session Done ✔️",
        `Session for booking ${booking.bookingId} on ${date} has been completed.`
      );
    }

    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Completed ✔️",
        `Booking ${booking.bookingId} session completed for ${date}.`
      );
    }

    // --------------------------------------------------

    return apiResponse(true, "Day session completed", {
      bookingId: booking.bookingId || "",
      date: date || "",
      dayStatus: dayEntry.status || "",
      bookingStatus: booking.status || "",
      completedAt: dayEntry.completedAt || "",
    });
  } catch (error) {
    console.error("End day session error:", error);
    return apiResponse(false, "Server error");
  }
}
