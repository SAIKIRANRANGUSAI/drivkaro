import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import BookingDay from "@/models/BookingDay";

export async function POST(
  req: NextRequest,
  context: { params: { bookingId: string; date: string } }
) {
  try {
    const { bookingId, date } = context.params;
    const { otp } = await req.json();

    // Validate required values
    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date and otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find or create booking day
    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });

    if (!bookingDay) {
      bookingDay = new BookingDay({
        booking: bookingId,
        date,
      });
    }

    // Update
    bookingDay.startOtp = otp;
    bookingDay.status = "ongoing";
    bookingDay.startVerifiedAt = new Date();

    await bookingDay.save();

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
