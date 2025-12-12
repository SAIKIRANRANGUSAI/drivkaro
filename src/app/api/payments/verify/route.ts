import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Referral from "@/models/Referral";
import WalletTransaction from "@/models/WalletTransaction";
import { sendPushNotification } from "@/lib/sendNotification";

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

    // ----------------------------------------------------
    // 1️⃣ VERIFY SIGNATURE
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 2️⃣ FIND BOOKING USING razorpayOrderId
    // ----------------------------------------------------
    const booking = await Booking.findOne({ razorpayOrderId: orderId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found for this orderId" },
        { status: 404 }
      );
    }

    // Already verified?
    if (booking.paid) {
      return NextResponse.json(
        { success: true, message: "Payment already verified", data: booking },
        { status: 200 }
      );
    }

    // ----------------------------------------------------
    // 3️⃣ UPDATE BOOKING AS PAID
    // ----------------------------------------------------
    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.paymentTxnRef = paymentId;
    booking.paymentVerifiedAt = new Date();
    await booking.save();

    // ----------------------------------------------------
    // 4️⃣ REFERRAL AUTO CREDIT (Only on FIRST payment)
    // ----------------------------------------------------
    const user = await User.findById(booking.userId);

    if (user) {
      const referral = await Referral.findOne({
        referredUser: user._id,
        status: "PENDING",
        bonusCredited: false,
      });

      if (referral) {
        const referrer = await User.findById(referral.referrer);

        if (referrer) {
          const bonusAmount = referral.bonusAmount || 100;

          // Credit wallet
          referrer.walletAmount += bonusAmount;
          await referrer.save();

          // Wallet transaction log
          await WalletTransaction.create({
            user: referrer._id,
            amount: bonusAmount,
            type: "REFERRAL_BONUS",
            referenceId: booking._id,
            remark: `Referral bonus for booking ${booking.bookingId}`,
          });

          // Mark referral as completed
          referral.status = "COMPLETED";
          referral.bonusCredited = true;
          referral.completedBookingId = booking._id;
          await referral.save();
        }
      }
    }

    // ----------------------------------------------------
    // 5️⃣ SEND USER NOTIFICATION
    // ----------------------------------------------------
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Payment Successful 🎉",
        `Your payment for booking ${booking.bookingId} is successful.`
      );
    }

    // 🔥 ADMIN NOTIFICATION
    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "New Payment Received",
        `Payment for booking ${booking.bookingId} is verified.`
      );
    }

    // ----------------------------------------------------
    // 6️⃣ RESPONSE
    // ----------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: {
          bookingId: booking.bookingId,
          amount: booking.totalAmount,
          status: booking.paymentStatus,
          paymentId,
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
