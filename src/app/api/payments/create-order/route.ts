import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { razorpay } from "@/lib/razorpay";

// 🔹 Utility: remove null / undefined
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

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId required", data: {} },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // FIND BOOKING
    // ---------------------------------------
    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: {} },
        { status: 404 }
      );
    }

    // ---------------------------------------
    // FIND USER
    // ---------------------------------------
    const user = await User.findById(booking.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found", data: {} },
        { status: 404 }
      );
    }

    // ---------------------------------------
    // CALCULATE AMOUNTS
    // ---------------------------------------
    const totalAmount = Number(booking.amount) || 0;
    let walletUsed = 0;
    let remainingAmount = totalAmount;

    if (user.walletAmount > 0 && totalAmount > 0) {
      walletUsed = Math.min(user.walletAmount, totalAmount);
      remainingAmount = totalAmount - walletUsed;

      user.walletAmount -= walletUsed;
      await user.save();
    }

    // ---------------------------------------
    // CREATE RAZORPAY ORDER
    // ---------------------------------------
    let razorpayOrder: any = null;

    if (remainingAmount > 0) {
      razorpayOrder = await razorpay.orders.create({
        amount: remainingAmount * 100,
        currency: "INR",
        receipt: booking._id.toString(),
      });
    }

    // ---------------------------------------
    // SAVE PAYMENT LOG
    // ---------------------------------------
    const payment = await Payment.create({
      bookingId: booking._id,
      userId: user._id,
      razorpayOrderId: razorpayOrder?.id || "",
      amount: remainingAmount,
      walletUsed,
      status: "PENDING",
      rawResponse: razorpayOrder || {},
    });

    // ---------------------------------------
    // UPDATE BOOKING
    // ---------------------------------------
    booking.walletUsed = walletUsed;
    booking.remainingToPay = remainingAmount;
    booking.razorpayOrderId = razorpayOrder?.id || "";
    await booking.save();

    // ---------------------------------------
    // RESPONSE (✅ ALWAYS 200)
    // ---------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        data: sanitize({
          orderId: razorpayOrder?.id || "",
          amountToPay: remainingAmount,
          walletUsed,
          currency: "INR",
          bookingId: booking._id.toString(),
          paymentId: payment._id.toString(),
        }),
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Order Error:", err);
    return NextResponse.json(
      { success: false, message: "Order creation failed", data: {} },
      { status: 500 }
    );
  }
}
