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

    if (!bookingId || !date) {
      return apiResponse(false, "bookingId and date are required");
    }

    await connectDB();

    // ✔ find booking by ObjectId or bookingId
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

    // ❌ must be paid
    if (!booking.paid) {
      return apiResponse(false, "Payment incomplete, cannot mark missed");
    }

    // ❌ booking must be ongoing
    if (booking.status !== "ongoing") {
      return apiResponse(false, "Booking is not active/ongoing");
    }

    // ✔ find day entry
    const dayEntry = booking.days.find((d: any) => d.date === date);

    if (!dayEntry) {
      return apiResponse(false, "No day schedule found for this date");
    }

    // ❌ prevent duplicate missed
    if (dayEntry.status === "missed") {
      return apiResponse(false, "Day already marked missed");
    }

    // ❌ cannot mark completed
    if (dayEntry.status === "completed") {
      return apiResponse(false, "Day already completed");
    }

    // -------------------------------------
    // 1️⃣ MARK MISSED (BookingDay collection)
    // -------------------------------------

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

    bookingDay.status = "missed";
    bookingDay.missedAt = new Date();
    await bookingDay.save();

    // -------------------------------------
    // 2️⃣ UPDATE EMBEDDED DAY
    // -------------------------------------

    dayEntry.status = "missed";
    dayEntry.missedAt = new Date();

    // -------------------------------------
    // 3️⃣ ADD EXTRA DAY
    // -------------------------------------

    const lastDay = booking.days[booking.days.length - 1];
    const lastDate = new Date(lastDay.date);

    lastDate.setDate(lastDate.getDate() + 1);
    const newDate = lastDate.toISOString().split("T")[0];

    booking.days.push({
      dayNo: booking.days.length + 1,
      date: newDate,
      slot: lastDay.slot || "",
      status: "pending",
      startOtp: "",
      endOtp: "",
      instructorId: "",
      startedAt: "",
      completedAt: "",
    });

    booking.daysCount = booking.days.length;
    await booking.save();

    // --------------------------------------------------
    // 🔔 SEND NOTIFICATIONS
    // --------------------------------------------------

    const user = await User.findById(booking.userId);
    const instructor = await User.findById(booking.assignedInstructorId);

    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Session Missed ❗",
        `Your driving session on ${date} was marked as missed. A new day has been added.`
      );
    }

    if (instructor?.fcmToken) {
      await sendPushNotification(
        instructor.fcmToken,
        "User Missed Session 🚫",
        `The session on ${date} for booking ${booking.bookingId} was missed.`
      );
    }

    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "Missed Session Alert ⚠️",
        `Booking ${booking.bookingId} missed on ${date}. Extra day added.`
      );
    }

    // --------------------------------------------------

    return apiResponse(true, "Day marked missed. Extra day added.", {
      bookingId: booking.bookingId || "",
      missedDate: date || "",
      extraDayDate: newDate || "",
      totalDays: booking.days.length || 0,
      bookingStatus: booking.status || "",
    });
  } catch (error) {
    console.error("Missed day session error:", error);
    return apiResponse(false, "Server error");
  }
}
