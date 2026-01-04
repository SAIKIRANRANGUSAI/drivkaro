import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";

import Booking from "@/models/Booking";
import Payment from "@/models/Payment";

// 🔹 Utility
const sanitize = (o: any) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, v == null ? "" : v])
  );

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const payload = await req.text(); // Razorpay sends raw body
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing webhook signature", data: {} },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // 1️⃣ VERIFY RAZORPAY WEBHOOK SIGNATURE
    // ----------------------------------------------------
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(payload)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature", data: {} },
        { status: 400 }
      );
    }

    const event = JSON.parse(payload);

    // We only care about captured payments
    if (event.event !== "payment.captured") {
      return NextResponse.json(
        { success: true, message: "Event ignored", data: {} },
        { status: 200 }
      );
    }

    const paymentId = event.payload.payment.entity.id;
    const orderId = event.payload.payment.entity.order_id;

    // ----------------------------------------------------
    // 2️⃣ FIND PAYMENT & BOOKING
    // ----------------------------------------------------
    const payment: any = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found", data: {} },
        { status: 404 }
      );
    }

    const booking: any = await Booking.findById(payment.bookingId);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: {} },
        { status: 404 }
      );
    }

    // ----------------------------------------------------
    // 3️⃣ IDEMPOTENT CHECK
    // ----------------------------------------------------
    if (payment.status === "SUCCESS" || booking.paid) {
      return NextResponse.json(
        {
          success: true,
          message: "Payment already processed",
          data: sanitize({
            bookingId: booking.bookingId,
            bookingStatus: booking.status,
            paymentStatus: booking.paymentStatus
          })
        },
        { status: 200 }
      );
    }

    // ----------------------------------------------------
    // 4️⃣ WALLET-ONLY CASE (amount = 0)
    // ----------------------------------------------------
    if (payment.amount === 0) {
      payment.status = "PAID_BY_WALLET";
      payment.verifiedAt = new Date();
      await payment.save();

      booking.paid = true;
      booking.paymentStatus = "SUCCESS";
      booking.status = "ongoing";
      booking.paymentTxnRef = "wallet-only";
      booking.paymentVerifiedAt = new Date();
      await booking.save();

      return NextResponse.json(
        {
          success: true,
          message: "Wallet-only payment marked success",
          data: sanitize({
            bookingId: booking.bookingId,
            status: booking.paymentStatus,
            bookingStatus: booking.status
          })
        },
        { status: 200 }
      );
    }

    // ----------------------------------------------------
    // 5️⃣ MARK PAYMENT AS SUCCESS (gateway)
    // ----------------------------------------------------
    payment.status = "SUCCESS";
    payment.paymentId = paymentId;
    payment.verifiedAt = new Date();
    await payment.save();

    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.status = "ongoing";
    booking.paymentTxnRef = paymentId;
    booking.paymentVerifiedAt = new Date();
    await booking.save();

    // ----------------------------------------------------
    // 6️⃣ RESPONSE
    // ----------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified via webhook",
        data: sanitize({
          bookingId: booking.bookingId,
          amount: payment.amount,
          walletUsed: payment.walletUsed,
          status: booking.paymentStatus,
          bookingStatus: booking.status,
          paymentId
        })
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
