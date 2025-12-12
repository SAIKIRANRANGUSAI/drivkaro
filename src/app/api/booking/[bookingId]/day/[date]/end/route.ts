import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";
import User from "@/models/User";                           // ⬅ added
import { sendPushNotification } from "@/lib/sendNotification"; // ⬅ added

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;
    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date and otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1️⃣ Lookup booking
    let booking = null;
    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.paid || booking.status !== "ongoing") {
      return NextResponse.json(
        { success: false, message: "Booking not active" },
        { status: 400 }
      );
    }

    // 2️⃣ Locate Day
    const dayEntry = booking.days.find((d: any) => d.date === date);

    if (!dayEntry) {
      return NextResponse.json(
        { success: false, message: "No schedule found for this date" },
        { status: 404 }
      );
    }

    // 3️⃣ Validate START session — based on your DB structure
    if (dayEntry.status !== "started") {
      return NextResponse.json(
        { success: false, message: "Start session not completed yet" },
        { status: 400 }
      );
    }

    if (!dayEntry.startedAt) {
      return NextResponse.json(
        { success: false, message: "Start OTP not verified" },
        { status: 400 }
      );
    }

    // 4️⃣ Validate End OTP
    if (dayEntry.endOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid end OTP" },
        { status: 400 }
      );
    }

    // 5️⃣ Update BookingDay database
    let bookingDay = await BookingDay.findOne({ booking: booking._id, date });

    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: booking._id, date });
    }

    bookingDay.endVerifiedAt = new Date();
    bookingDay.status = "completed";
    await bookingDay.save();

    // 6️⃣ Update embedded dayEntry
    dayEntry.status = "completed";
    dayEntry.completedAt = new Date();

    await booking.save();

    // 7️⃣ If all days completed → complete booking
    const allCompleted = booking.days.every((d: any) => d.status === "completed");
    if (allCompleted) {
      booking.status = "completed";
      booking.completedAt = new Date();
      await booking.save();
    }

    // ------------------------------------------------------------------
    // 🔔 SEND NOTIFICATIONS — ONLY THIS BLOCK ADDED
    // ------------------------------------------------------------------

    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    // Notify User
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Session Completed 🎉",
        `Your driving session on ${date} is successfully completed.`
      );
    }

    // Notify Instructor
    if (instructor?.fcmToken) {
      await sendPushNotification(
        instructor.fcmToken,
        "User Session Done ✔️",
        `The session on ${date} for booking ${booking.bookingId} has been completed.`
      );
    }

    // Notify Admin
    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Session Completed ✔️",
        `Booking ${booking.bookingId} session completed for ${date}.`
      );
    }

    // ------------------------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Day session completed",
      data: {
        date,
        status: dayEntry.status,
        bookingStatus: booking.status,
      },
    });

  } catch (err) {
    console.error("End day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
