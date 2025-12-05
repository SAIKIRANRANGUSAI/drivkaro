import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

interface BookingParams {
  bookingId: string;
  date: string;
}

interface BookingDay {
  date: string;
  endOTP?: string;
  status?: string;
  endedAt?: Date;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<BookingParams> }
) {
  await connectDB();

  // Next.js 16: params is a Promise
  const { bookingId, date } = await context.params;

  const { otp } = await req.json();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({
      success: false,
      message: "Not found",
    });
  }

  const day = booking.days.find((d: BookingDay) => d.date === date);
  if (!day) {
    return NextResponse.json({
      success: false,
      message: "Invalid day",
    });
  }

  day.endOTP = otp;
  day.status = "completed";
  day.endedAt = new Date();

  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Session completed",
  });
}
