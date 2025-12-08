import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId, txnRef, status } = await req.json();

    // ====== VALIDATION ======
    if (!bookingId || !txnRef || !status) {
      return NextResponse.json(
        { success: false, message: "bookingId, txnRef & status are required" },
        { status: 400 }
      );
    }

    if (!["success", "failed"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // ====== FIND BOOKING ======
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // ====== UPDATE PAYMENT ======
    booking.paymentTxnRef = txnRef;
    booking.paymentStatus = status;

    if (status === "success") {
      booking.paid = true;
      booking.status = "ongoing";
    } else {
      booking.paid = false;
      // keep same status "pending"
    }

    await booking.save();

    // ====== RESPONSE ======
    return NextResponse.json({
      success: true,
      message: "Payment webhook processed",
      booking,
    });

  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
