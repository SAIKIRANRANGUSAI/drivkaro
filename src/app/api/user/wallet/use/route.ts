// src/app/api/user/wallet/use/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongoose";

import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export async function POST(req: NextRequest) {
  const session = await (await connectDB()).startSession();

  try {
    const { userId, bookingId, requestedAmount, usageType } = await req.json();
    // usageType: "BOOKING_PAYMENT" | "TIP_PAYMENT"

    // ================= VALIDATION =================
    if (!userId || !bookingId || !requestedAmount || requestedAmount <= 0) {
      return NextResponse.json({
        success: false,
        code: "INVALID_REQUEST",
        message: "Invalid request parameters",
        data: null,
      });
    }

    if (!["BOOKING_PAYMENT", "TIP_PAYMENT"].includes(usageType)) {
      return NextResponse.json({
        success: false,
        code: "INVALID_USAGE_TYPE",
        message: "Invalid usage type",
        data: null,
      });
    }

    session.startTransaction();

    // ================= GET USER =================
    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ).session(session);

    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
      });
    }

    const currentBalance = user.walletAmount || 0;

    if (currentBalance <= 0) {
      await session.abortTransaction();
      return NextResponse.json({
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message: "Insufficient wallet balance",
        data: null,
      });
    }

    // ================= WALLET DEDUCTION =================
    const amountToUse = Math.min(currentBalance, requestedAmount);

    user.walletAmount = currentBalance - amountToUse;
    await user.save({ session });

    await WalletTransaction.create(
      [
        {
          user: user._id,
          amount: -amountToUse,
          type: usageType,
          referenceId: bookingId,
          remark:
            usageType === "BOOKING_PAYMENT"
              ? "Used for booking payment"
              : "Used for tip payment",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // ================= SUCCESS =================
    return NextResponse.json({
      success: true,
      code: "WALLET_USED",
      message: "Wallet amount used successfully",
      data: {
        usedAmount: amountToUse,
        remainingWallet: user.walletAmount,
        usageType,
        bookingId,
      },
    });
  } catch (error: any) {
    console.error("Wallet use error:", error);
    await session.abortTransaction();

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong",
      data: null,
    });
  } finally {
    session.endSession();
  }
}
