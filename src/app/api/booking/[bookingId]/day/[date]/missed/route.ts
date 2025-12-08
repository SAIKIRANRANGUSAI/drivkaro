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

    // -------------------------------------
    // 1. FIND or CREATE BookingDay record
    // -------------------------------------
    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: bookingId, date });
    }

    bookingDay.status = "missed";
    await bookingDay.save();

    // -------------------------------------
    // 2. UPDATE BOOKING DAYS ARRAY STATUS
    // -------------------------------------
    await Booking.updateOne(
      { _id: bookingId, "days.date": date },
      {
        $set: {
          "days.$.status": "missed",
        },
      }
    );

    // -------------------------------------
    // 3. ADD EXTRA DAY
    // -------------------------------------

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // find last date in days array
    const lastDay = booking.days[booking.days.length - 1];
    const lastDate = new Date(lastDay.date);

    // add 1 day
    lastDate.setDate(lastDate.getDate() + 1);

    const newDate = lastDate.toISOString().split("T")[0];

    // push new day into booking.days
    booking.days.push({
      date: newDate,
      slot: lastDay.slot, // same slot
      status: "pending",
      startOtp: null,
      endOtp: null,
      instructorId: null,
    });

    // increment day count
    booking.daysCount = booking.days.length;

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Day marked missed. Extra day added.",
      extraDayAdded: newDate,
    });

  } catch (err) {
    console.error("Missed day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
