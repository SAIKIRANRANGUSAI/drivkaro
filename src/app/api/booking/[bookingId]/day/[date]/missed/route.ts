import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

interface BookingParams {
  bookingId: string;
  date: string;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<BookingParams> }
) {
  await connectDB();

  const { bookingId, date } = await context.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" });
  }

  const day = booking.days.find((d: any) => d.date === date);
  if (!day) {
    return NextResponse.json({ success: false, message: "Invalid day" });
  }

  day.status = "missed";
  day.missedAt = new Date();

  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Day marked as missed",
  });
}
