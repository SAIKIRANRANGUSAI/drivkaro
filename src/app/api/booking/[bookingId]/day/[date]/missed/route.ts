import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req, { params }) {
  await connectDB();

  const { bookingId, date } = params;

  const booking = await Booking.findById(bookingId);
  if (!booking) return NextResponse.json({ success: false, message: "Not found" });

  const day = booking.days.find((d) => d.date === date);
  if (!day) return NextResponse.json({ success: false, message: "Invalid day" });

  // Mark missed
  day.status = "missed";
  day.isMissed = true;

  // Add new day at end
  const lastDay = booking.days[booking.days.length - 1];
  const nextDate = new Date(lastDay.date);
  nextDate.setDate(nextDate.getDate() + 1);

  booking.days.push({
    date: nextDate.toISOString().slice(0, 10),
    slot: lastDay.slot,
    status: "pending"
  });

  await booking.save();

  return NextResponse.json({
    success: true,
    message: "Day marked missed and extra day added"
  });
}
