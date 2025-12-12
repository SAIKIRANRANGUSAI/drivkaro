import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { orderId, paymentId, signature } = await req.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 1️⃣ VERIFY SIGNATURE
    // ---------------------------------------------
    const body = orderId + "|" + paymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature – Payment tampered" },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // 2️⃣ FIND THE BOOKING USING orderId
    // ---------------------------------------------
    const booking = await Booking.findOne({ paymentTxnRef: orderId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found for this orderId" },
        { status: 404 }
      );
    }

    // Already paid?
    if (booking.paid) {
      return NextResponse.json(
        { success: true, message: "Payment already verified", data: booking },
        { status: 200 }
      );
    }

    // ---------------------------------------------
    // 3️⃣ UPDATE BOOKING AS PAID
    // ---------------------------------------------
    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.paymentTxnRef = paymentId;
    await booking.save();

    // ---------------------------------------------
    // 4️⃣ RESPONSE
    // ---------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: {
          bookingId: booking.bookingId,
          amount: booking.totalAmount,
          status: booking.paymentStatus,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Payment verify error:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
