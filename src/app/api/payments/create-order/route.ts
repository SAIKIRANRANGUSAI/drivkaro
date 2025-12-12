import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId required" },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // FIND BOOKING
    // ---------------------------------------
    let booking = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------
    // FIND USER
    // ---------------------------------------
    const user = await User.findById(booking.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------
    // CALCULATE AMOUNTS
    // ---------------------------------------
    const totalAmount = booking.amount;
    let walletUsed = 0;
    let remainingAmount = totalAmount;

    // WALLET DEDUCTION
    if (user.walletAmount > 0) {
      walletUsed = Math.min(user.walletAmount, totalAmount);
      remainingAmount = totalAmount - walletUsed;

      user.walletAmount -= walletUsed;
      await user.save();
    }

    // ---------------------------------------
    // CREATE RAZORPAY ORDER
    // ---------------------------------------
    let razorpayOrder = null;

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
    await Payment.create({
      bookingId: booking._id,
      userId: user._id,
      razorpayOrderId: razorpayOrder?.id || null,
      amount: remainingAmount,
      walletUsed,
      status: "PENDING",
      rawResponse: razorpayOrder,
    });

    // ---------------------------------------
    // UPDATE BOOKING
    // ---------------------------------------
    booking.walletUsed = walletUsed;
    booking.remainingToPay = remainingAmount;
    booking.razorpayOrderId = razorpayOrder?.id || null;
    await booking.save();

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------
    return NextResponse.json({
      success: true,
      message: "Order created",
      data: {
        orderId: razorpayOrder?.id || null,
        amountToPay: remainingAmount,
        walletUsed,
        currency: "INR",
      },
    });
  } catch (err) {
    console.error("Order Error:", err);
    return NextResponse.json(
      { success: false, message: "Order creation failed" },
      { status: 500 }
    );
  }
}
