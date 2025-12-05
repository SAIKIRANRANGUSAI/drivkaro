import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

interface BookingParams {
  bookingId: string;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<BookingParams> }
) {
  await connectDB();

  const { bookingId } = await context.params;

  const instructorId = req.headers.get("x-instructor-id");
  if (!instructorId) {
    return NextResponse.json({ success: false, message: "Unauthorized" });
  }

  const { reason } = await req.json();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Not found" });
  }

  booking.instructorId = null;
  booking.status = "pending";
  booking.rejectionReason = reason;

  await booking.save();

  return NextResponse.json({ success: true });
}
