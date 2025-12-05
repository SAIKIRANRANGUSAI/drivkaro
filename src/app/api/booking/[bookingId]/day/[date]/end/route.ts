import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  await connectDB();

  const { otp } = await req.json();

  // IMPORTANT: params is a Promise in Next.js 16
  const { bookingId, date } = await context.params;

  const booking = await Booking.findById(bookingId);
  if (!booking)
    return NextResponse.json({ success: false, message: "Not found" });

  const day = booking.days.find((d) => d.date === date);
  if (!day)
    return NextResponse.json({ success: false, message: "Invalid day" });

  day.endOTP = otp;
  day.status = "completed";
  day.endedAt = new Date();

  await booking.save();

  return NextResponse.json({ success: true, message: "Session completed" });
}
