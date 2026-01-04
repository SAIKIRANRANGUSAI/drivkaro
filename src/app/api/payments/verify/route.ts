import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";

import Booking from "@/models/Booking";
import User from "@/models/User";
import Referral from "@/models/Referral";
import WalletTransaction from "@/models/WalletTransaction";
import Payment from "@/models/Payment";
import { sendPushNotification } from "@/lib/sendNotification";

// 🔹 Utility
function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj).forEach(k => clean[k] = obj[k] ?? "");
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId, paymentId, signature } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "orderId required", data: {} },
        { status: 400 }
      );
    }

    /* ------------------------------------------
       1️⃣ FIND PAYMENT + BOOKING
    ------------------------------------------ */
    const payment: any = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment)
      return NextResponse.json(
        { success: false, message: "Payment record not found", data: {} },
        { status: 404 }
      );

    const booking: any = await Booking.findById(payment.bookingId);
    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found", data: {} },
        { status: 404 }
      );

    /* ------------------------------------------
       2️⃣ WALLET-ONLY PAYMENT (no gateway)
    ------------------------------------------ */
    if (payment.amount === 0) {
      if (payment.status !== "SUCCESS") {
        payment.status = "SUCCESS";
        payment.paidVia = "WALLET";
        payment.verifiedAt = new Date();
        await payment.save();
      }

      if (!booking.paid) {
        booking.paid = true;
        booking.paymentStatus = "SUCCESS";
        booking.status = "ongoing";
        booking.paymentVerifiedAt = new Date();
        booking.paymentTxnRef = "WALLET_ONLY";
        await booking.save();
      }

      return NextResponse.json(
        {
          success: true,
          message: "Payment completed via wallet",
          data: sanitize({
            bookingId: booking.bookingId,
            status: booking.paymentStatus,
            bookingStatus: booking.status
          })
        },
        { status: 200 }
      );
    }

    /* ------------------------------------------
       3️⃣ IDEMPOTENCY CHECK (already verified)
    ------------------------------------------ */
    if (payment.status === "SUCCESS" || booking.paid) {
      return NextResponse.json(
        {
          success: true,
          message: "Payment already verified",
          data: sanitize({
            bookingId: booking.bookingId,
            status: booking.paymentStatus,
            bookingStatus: booking.status,
            paymentId: payment.paymentId || paymentId || ""
          })
        },
        { status: 200 }
      );
    }

    /* ------------------------------------------
       4️⃣ VERIFY RAZORPAY SIGNATURE
    ------------------------------------------ */
    if (!paymentId || !signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification fields", data: {} },
        { status: 400 }
      );
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature", data: {} },
        { status: 400 }
      );
    }

    /* ------------------------------------------
       5️⃣ MARK PAYMENT SUCCESS
    ------------------------------------------ */
    payment.status = "SUCCESS";
    payment.paymentId = paymentId;
    payment.paidVia = "RAZORPAY";
    payment.verifiedAt = new Date();
    await payment.save();

    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.status = "ongoing";
    booking.paymentTxnRef = paymentId;
    booking.paymentVerifiedAt = new Date();
    await booking.save();

    /* ------------------------------------------
       6️⃣ REFERRAL BONUS — FIRST SUCCESS ONLY
    ------------------------------------------ */
    const user = await User.findById(booking.userId);

    if (user && user.usedReferralCode) {
      const referral = await Referral.findOne({
        referredUser: user._id,
        status: "PENDING",
        bonusCredited: false
      });

      if (referral) {
        const referrer = await User.findById(referral.referrer);

        if (referrer) {
          const bonusAmount = Number(referral.bonusAmount || 100);

          referrer.walletAmount += bonusAmount;
          await referrer.save();

          await WalletTransaction.create({
            user: referrer._id,
            amount: bonusAmount,
            type: "REFERRAL_BONUS",
            referenceId: booking._id,
            remark: `Referral bonus earned from ${user.fullName || user.mobile}`
          });

          referral.status = "COMPLETED";
          referral.bonusCredited = true;
          referral.completedBookingId = booking._id;
          await referral.save();

          // optional: notify referrer
          // await sendPushNotification(referrer.fcmToken, "🎁 Referral Bonus Added", `You earned ₹${bonusAmount} wallet cash`);
        }
      }
    }

    /* ------------------------------------------
       7️⃣ USER NOTIFICATION
    ------------------------------------------ */
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Payment Successful 🎉",
        `Your payment for booking ${booking.bookingId} was successful.`
      );
    }

    /* ------------------------------------------
       8️⃣ RESPONSE
    ------------------------------------------ */
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: sanitize({
          bookingId: booking.bookingId,
          amount: payment.amount,
          walletUsed: payment.walletUsed,
          status: booking.paymentStatus,
          paymentId,
          bookingStatus: booking.status
        })
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PAYMENT VERIFY ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
