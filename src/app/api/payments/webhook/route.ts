import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { bookingId, txnRef, status } = body;

    if (!bookingId || !txnRef || !status) {
      return NextResponse.json(
        { success: false, message: "bookingId, txnRef, status required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    booking.paymentStatus = status;
    booking.paymentTxnRef = txnRef;
    if (status === "success") booking.status = "ongoing";

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Payment webhook processed",
    });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
