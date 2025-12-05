import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req) {
  await connectDB();

  const { bookingId, status, txnRef } = await req.json();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return NextResponse.json({ success: false, message: "Booking not found" });
  }

  if (status === "success") {
    booking.paid = true;
    booking.status = "accepted";
    booking.txnRef = txnRef;
    await booking.save();
  }

  return NextResponse.json({ success: true });
}
