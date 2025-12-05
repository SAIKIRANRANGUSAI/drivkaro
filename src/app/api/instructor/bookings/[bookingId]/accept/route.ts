import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req, { params }) {
  await connectDB();

  const instructorId = req.headers.get("x-instructor-id");
  if (!instructorId) {
    return NextResponse.json({ success: false, message: "Unauthorized" });
  }

  const booking = await Booking.findById(params.bookingId);
  if (!booking) return NextResponse.json({ success: false, message: "Not found" });

  booking.instructorId = instructorId;
  booking.status = "in-progress";

  await booking.save();

  return NextResponse.json({ success: true });
}
