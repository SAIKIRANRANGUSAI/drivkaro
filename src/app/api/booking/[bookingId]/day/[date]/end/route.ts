import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";

const api = (ok: boolean, msg: string, data: any = {}) =>
  NextResponse.json({ success: ok, message: msg, data }, { status: 200 });

// 🇮🇳 India-timezone YYYY-MM-DD
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await params;
    const { otp } = await req.json();

    if (!bookingId || !date || !otp)
      return api(false, "bookingId, date and otp are required");

    await connectDB();

    // 🔎 Find booking (by ObjectId or bookingId)
    let booking: any = null;
    if (/^[0-9a-fA-F]{24}$/.test(bookingId))
      booking = await Booking.findById(bookingId);
    if (!booking)
      booking = await Booking.findOne({ bookingId });

    if (!booking) return api(false, "Booking not found");
    if (!booking.paid) return api(false, "Payment not completed");
    if (!booking.assignedInstructorId)
      return api(false, "Instructor not assigned");

    if (booking.status !== "ongoing")
      return api(false, "Booking is not active");

    // 🔎 Locate day entry
    const day = booking.days.find((d: any) => d.date === date);
    if (!day) return api(false, "No schedule found for this date");

    // ⛔ Session must be ended only for today
    if (date !== today())
      return api(false, "Session can be ended only for today", {
        allowedDate: today(),
      });

    // ⛔ Must have been started first
    if (day.status !== "started")
      return api(false, "Session not started yet");

    if (!day.startedAt)
      return api(false, "Start OTP not verified");

    // ⛔ Prevent duplicate completion
    if (day.status === "completed")
      return api(false, "Session already completed");

    // 🔐 Validate END OTP
    if (day.endOtp !== otp)
      return api(false, "Invalid end OTP");

    // 📝 Save in BookingDay collection (if used in reports)
    let bookingDay = await BookingDay.findOne({
      booking: booking._id,
      date,
    });

    if (!bookingDay)
      bookingDay = new BookingDay({ booking: booking._id, date });

    bookingDay.endVerifiedAt = new Date();
    bookingDay.status = "completed";
    await bookingDay.save();

    // 🟢 Update embedded booking day
    day.status = "completed";
    day.completedAt = new Date();
    await booking.save();

    // 🎯 If ALL days done → close booking
    const allDone = booking.days.every(
      (d: any) => d.status === "completed" || d.status === "missed"
    );

    if (allDone) {
      booking.status = "completed";
      booking.completedAt = new Date();
      await booking.save();
    }

    // 🔔 Notifications
    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    if (user?.fcmToken)
      await sendPushNotification(
        user.fcmToken,
        "Session Completed 🎉",
        `Your driving session on ${date} is completed.`
      );

    if (instructor?.fcmToken)
      await sendPushNotification(
        instructor.fcmToken,
        "Session Closed ✔️",
        `Session for booking ${booking.bookingId} has been completed.`
      );

    if (process.env.ADMIN_FCM_TOKEN)
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Completed ✔️",
        `Booking ${booking.bookingId} session completed for ${date}.`
      );

    return api(true, "Day session completed", {
      bookingId: booking.bookingId,
      date,
      dayStatus: day.status,
      bookingStatus: booking.status,
      completedAt: day.completedAt,
    });

  } catch (err) {
    console.error("END DAY ERROR >>>", err);
    return api(false, "Server error");
  }
}
