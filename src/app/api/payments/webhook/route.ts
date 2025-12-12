import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId is required" },
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

    // ✔ DIRECTLY UPDATE PAYMENT STATUS
    booking.paymentStatus = "success";
    booking.paid = true;
    booking.status = "completed"; // old logic you wanted
    booking.paymentTxnRef = "manual-complete";

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Payment status updated to completed",
    });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
