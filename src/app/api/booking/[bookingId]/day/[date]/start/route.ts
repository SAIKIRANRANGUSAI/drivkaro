import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

interface BookingParams {
  bookingId: string;
  date: string;
}

interface BookingDay {
  date: string;
  startOTP?: string;
  status?: string;
  startedAt?: Date;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<BookingParams> }
) {
  await connectDB();

  const { otp } = await req.json();

  const { bookingId, date } = await context.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Not found" });
  }

  const day = booking.days.find((d: BookingDay) => d.date === date);
  if (!day) {
    return NextResponse.json({ success: false, message: "Invalid day" });
  }

  day.startOTP = otp;
  day.status = "started";
  day.startedAt = new Date();

  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Session started",
  });
}
