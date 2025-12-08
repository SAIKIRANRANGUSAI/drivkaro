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

    // Find existing booking day
    const bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      return NextResponse.json(
        { success: false, message: "Booking day not found" },
        { status: 404 }
      );
    }

    // Update
    bookingDay.endOtp = otp;
    bookingDay.status = "completed";
    bookingDay.endVerifiedAt = new Date();

    await bookingDay.save();

    // UPDATE DAYS ARRAY IN BOOKING
    await Booking.updateOne(
      { _id: bookingId, "days.date": date },
      {
        $set: {
          "days.$.endOtp": otp,
          "days.$.status": "completed",
          "days.$.endVerifiedAt": new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Day session ended",
      day: bookingDay,
    });

  } catch (err) {
    console.error("End day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
