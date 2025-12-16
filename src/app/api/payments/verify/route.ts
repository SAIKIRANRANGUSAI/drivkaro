import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Referral from "@/models/Referral";
import WalletTransaction from "@/models/WalletTransaction";
import { sendPushNotification } from "@/lib/sendNotification";

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
    await dbConnect();

    const { orderId, paymentId, signature } = await req.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { success: false, message: "Missing required fields", data: {} },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // 1️⃣ VERIFY RAZORPAY SIGNATURE
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // 2️⃣ FIND BOOKING
    // ----------------------------------------------------
    const booking: any = await Booking.findOne({
      razorpayOrderId: orderId,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: {} },
        { status: 404 }
      );
    }

    // ----------------------------------------------------
    // 3️⃣ IDEMPOTENT CHECK
    // ----------------------------------------------------
    if (booking.paid) {
      return NextResponse.json(
        {
          success: true,
          message: "Payment already verified",
          data: sanitize({
            bookingId: booking.bookingId,
            paymentId: booking.paymentTxnRef,
            status: booking.paymentStatus,
          }),
        },
        { status: 200 }
      );
    }

    // ----------------------------------------------------
    // 4️⃣ UPDATE BOOKING
    // ----------------------------------------------------
    booking.paid = true;
    booking.paymentStatus = "SUCCESS";
    booking.status = "ongoing"; // ⭐ app requirement
    booking.paymentTxnRef = paymentId;
    booking.paymentVerifiedAt = new Date();
    await booking.save();

    // ----------------------------------------------------
    // 5️⃣ REFERRAL BONUS (FIRST PAYMENT ONLY)
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
          const bonusAmount = Number(referral.bonusAmount) || 100;

          referrer.walletAmount += bonusAmount;
          await referrer.save();

          await WalletTransaction.create({
            user: referrer._id,
            amount: bonusAmount,
            type: "REFERRAL_BONUS",
            referenceId: booking._id,
            remark: `Referral bonus for booking ${booking.bookingId}`,
          });

          referral.status = "COMPLETED";
          referral.bonusCredited = true;
          referral.completedBookingId = booking._id;
          await referral.save();
        }
      }
    }

    // ----------------------------------------------------
    // 6️⃣ PUSH NOTIFICATIONS
    // ----------------------------------------------------
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Payment Successful 🎉",
        `Your payment for booking ${booking.bookingId} was successful.`
      );
    }

    if (process.env.ADMIN_FCM_TOKEN) {
      await sendPushNotification(
        process.env.ADMIN_FCM_TOKEN,
        "New Payment Received",
        `Payment verified for booking ${booking.bookingId}.`
      );
    }

    // ----------------------------------------------------
    // 7️⃣ RESPONSE (✅ ALWAYS 200)
    // ----------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
        data: sanitize({
          bookingId: booking.bookingId,
          amount: booking.amount || 0,
          status: booking.paymentStatus,
          paymentId,
          bookingStatus: booking.status,
        }),
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Payment verify error:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
