import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;

    if (!bookingId || !date) {
      return NextResponse.json(
        { success: false, message: "bookingId and date are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✔ find booking by ObjectId or bookingId
    let booking = null;

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

    // ❌ must be paid
    if (!booking.paid) {
      return NextResponse.json(
        { success: false, message: "Payment incomplete, cannot mark missed" },
        { status: 400 }
      );
    }

    // ❌ booking must be ongoing
    if (booking.status !== "ongoing") {
      return NextResponse.json(
        { success: false, message: "Booking is not active/ongoing" },
        { status: 400 }
      );
    }

    // ✔ check correct day entry
    const dayEntry = booking.days.find((d: any) => d.date === date);

    if (!dayEntry) {
      return NextResponse.json(
        { success: false, message: "No day schedule found for this date" },
        { status: 404 }
      );
    }

    // ❌ prevent duplicate missed
    if (dayEntry.status === "missed") {
      return NextResponse.json(
        { success: false, message: "Day already marked missed" },
        { status: 400 }
      );
    }

    // ❌ cannot mark if completed
    if (dayEntry.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Day already completed" },
        { status: 400 }
      );
    }

    // -------------------------------------
    // 1️⃣ MARK MISSED (BookingDay DB)
    // -------------------------------------

    let bookingDay = await BookingDay.findOne({ booking: booking._id, date });

    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: booking._id, date });
    }

    bookingDay.status = "missed";
    bookingDay.missedAt = new Date();

    await bookingDay.save();

    // -------------------------------------
    // 2️⃣ UPDATE EMBEDDED ARRAY
    // -------------------------------------

    dayEntry.status = "missed";
    dayEntry.missedAt = new Date();

    // -------------------------------------
    // 3️⃣ ADD EXTRA DAY
    // -------------------------------------

    const last = booking.days[booking.days.length - 1];
    const lastDate = new Date(last.date);

    lastDate.setDate(lastDate.getDate() + 1);
    const newDate = lastDate.toISOString().split("T")[0];

    booking.days.push({
      dayNo: booking.days.length + 1,
      date: newDate,
      slot: last.slot,
      status: "pending",
      startOtp: null,
      endOtp: null,
      instructorId: null,
      startedAt: null,
      completedAt: null,
    });

    booking.daysCount = booking.days.length;

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Day marked missed. Extra day added.",
      data: {
        missedDate: date,
        extraDayDate: newDate,
        totalDays: booking.days.length,
      },
    });

  } catch (err) {
    console.error("Missed day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
