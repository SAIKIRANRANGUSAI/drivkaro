import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";

const api = (ok: boolean, msg: string, data: any = {}) =>
  NextResponse.json({ success: ok, message: msg, data }, { status: 200 });

const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await params;   // ⭐ IMPORTANT
    const { otp } = await req.json();

    if (!bookingId || !date || !otp)
      return api(false, "bookingId, date & otp are required");

    await connectDB();

    // 🔎 Get booking (ObjectId or bookingId)
    let booking: any = null;
    if (/^[0-9a-fA-F]{24}$/.test(bookingId))
      booking = await Booking.findById(bookingId);
    if (!booking)
      booking = await Booking.findOne({ bookingId });

    if (!booking) return api(false, "Booking not found");
    if (!booking.paid) return api(false, "Payment not completed");
    if (!booking.assignedInstructorId)
      return api(false, "Instructor not assigned");

    const day = booking.days.find((d: any) => d.date === date);
    if (!day) return api(false, "No session scheduled for this date");

    if (date !== today())
      return api(false, "Session allowed only for today", { allowedDate: today() });

    if (day.status === "started")
      return api(false, "Session already started");
    if (day.status === "completed")
      return api(false, "Session already completed");

    if (day.startOtp !== otp)
      return api(false, "Invalid OTP");

    // 🚀 START SESSION
    day.status = "started";
    day.startedAt = new Date();
    await booking.save();

    // 🔔 Notifications
    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    if (user?.fcmToken)
      await sendPushNotification(
        user.fcmToken,
        "Session Started 🚗",
        `Your driving session for ${booking.bookingId} has started.`
      );

    if (instructor?.fcmToken)
      await sendPushNotification(
        instructor.fcmToken,
        "Training Started 👨‍🏫",
        `Session for booking ${booking.bookingId} has started.`
      );

    if (process.env.ADMIN_FCM_TOKEN)
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Started 🔥",
        `Booking ${booking.bookingId} session started today.`
      );

    return api(true, "Day session started", {
      bookingId: booking.bookingId,
      date: day.date,
      startedAt: day.startedAt,
    });

  } catch (err) {
    console.error("START DAY ERROR >>>", err);
    return api(false, "Server error");
  }
}
