import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

// 🔹 utility: remove null / undefined
function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    clean[key] =
      obj[key] === null || obj[key] === undefined ? "" : obj[key];
  });
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId } = await req.json();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          message: "bookingId is required",
          data: {},
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // FIND BOOKING
    // -----------------------------
    let booking: any = null;

    // Mongo ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    // Custom bookingId (BKxxxx)
    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          message: "Booking not found",
          data: {},
        },
        { status: 404 }
      );
    }

    // -----------------------------
    // IDEMPOTENT CHECK
    // -----------------------------
    if (booking.paid === true) {
      return NextResponse.json(
        {
          success: true,
          message: "Payment already marked as successful",
          data: sanitize({
            bookingId: booking.bookingId,
            bookingStatus: booking.status,
            paymentStatus: booking.paymentStatus,
            paid: true,
          }),
        },
        { status: 200 }
      );
    }

    // -----------------------------
    // UPDATE BOOKING
    // -----------------------------
    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.status = "ongoing";
    booking.paymentTxnRef = "MANUAL";
    booking.paymentVerifiedAt = new Date();

    await booking.save();

    // -----------------------------
    // RESPONSE (APP FRIENDLY)
    // -----------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Payment marked as successful",
        data: sanitize({
          bookingId: booking.bookingId,
          bookingStatus: booking.status,
          paymentStatus: booking.paymentStatus,
          paid: booking.paid,
        }),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Manual payment error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: {},
      },
      { status: 500 }
    );
  }
}
