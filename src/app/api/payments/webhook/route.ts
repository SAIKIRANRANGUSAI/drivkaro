import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const secret = "UAHjDNR6V01i358nRzfJowTK";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    if (event.event !== "payment.captured")
      return NextResponse.json({ success: true, message: "Ignored event" });

    const payment = event.payload.payment.entity;

    const booking = await Booking.findOne({
      razorpayOrderId: payment.order_id,
    });

    if (!booking)
      return NextResponse.json({ success: false, message: "Booking not found" });

    booking.paymentTxnRef = payment.id;
    booking.paymentStatus = "success";
    booking.paid = true;
    booking.status = "ongoing";

    await booking.save();

    return NextResponse.json({ success: true, message: "Payment Captured" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ success: false, message: "Webhook error" }, { status: 500 });
  }
}
