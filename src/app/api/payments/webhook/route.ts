import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Referral from "@/models/Referral";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

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

    // Try ObjectId first
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

    // ===========================
    // ON SUCCESS
    // ===========================
    if (status === "success") {
      booking.paid = true;
      booking.status = "ongoing";
      await booking.save();

      // ==========================================
      // REFERRAL AUTO-CREDIT LOGIC (SAFE)
      // ==========================================

      let usedUserId: any = null;

      // SAFELY POPULATE USER
      if (booking.bookedFor === "other") {
        await booking.populate("otherUserId");
        if (booking.otherUserId) {
          usedUserId = booking.otherUserId._id;
        }
      }

      // If null, fallback to userId
      if (!usedUserId) {
        await booking.populate("userId");
        if (booking.userId) {
          usedUserId = booking.userId._id;
        }
      }

      // If STILL null -> no referral
      if (!usedUserId) {
        console.log("⚠️ No valid user found for referral");
      } else {
        // Find referral record
        const referral = await Referral.findOne({
          referredUser: usedUserId,
          status: { $in: ["PENDING", "pending"] },
        });

        // If referral exists and NOT credited yet
        if (referral && !referral.bonusCredited) {
          const referrer = await User.findById(referral.referrer);

          if (referrer) {
            const bonusAmount = referral.bonusAmount || 100;

            // CREDIT WALLET
            referrer.walletAmount =
              (referrer.walletAmount || 0) + bonusAmount;
            await referrer.save();

            // ADD TRANSACTION RECORD
            await WalletTransaction.create({
              user: referrer._id,
              amount: bonusAmount,
              type: "REFERRAL_BONUS",
              referenceId: booking._id,
              remark: `Referral bonus for booking ${booking.bookingId}`,
            });

            // MARK REFERRAL COMPLETED
            referral.status = "COMPLETED";
            referral.bonusCredited = true;
            referral.completedBookingId = booking._id;
            await referral.save();

            console.log(
              `🎉 Referral credited automatically: +${bonusAmount} to ${referrer._id}`
            );
          }
        }
      }
    }

    // ===========================
    // ON FAILED PAYMENT
    // ===========================
    else {
      booking.paid = false;
      booking.status = "pending";
      await booking.save();
    }

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
  } catch (err: any) {
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
