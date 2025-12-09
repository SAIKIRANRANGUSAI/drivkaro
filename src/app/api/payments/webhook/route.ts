import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId, txnRef, status } = await req.json();

    // ====== VALIDATION ======
    if (!bookingId || !txnRef || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "bookingId, txnRef & status are required",
        },
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
    let booking = null;

    // Try ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    // Try bookingId format BKxxxx
    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

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
      booking.status = "pending"; // keep pending if failed
    }

    await booking.save();

    // ====== RESPONSE ======
    return NextResponse.json({
      success: true,
      message: "Payment webhook processed",
      data: {
        bookingId: booking.bookingId,
        status: booking.paymentStatus,
        paid: booking.paid,
      },
    });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
