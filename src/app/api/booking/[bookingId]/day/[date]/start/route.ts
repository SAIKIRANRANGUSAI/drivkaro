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
    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date and otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Update BookingDay
    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: bookingId, date });
    }

    bookingDay.startOtp = otp;
    bookingDay.status = "ongoing";
    bookingDay.startVerifiedAt = new Date();

    await bookingDay.save();

    // UPDATE BOOKING DAYS ARRAY
    await Booking.updateOne(
      { _id: bookingId, "days.date": date },
      {
        $set: {
          "days.$.startOtp": otp,
          "days.$.status": "ongoing",
          "days.$.startVerifiedAt": new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Day session started",
      day: bookingDay,
    });

  } catch (err) {
    console.error("Start day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
