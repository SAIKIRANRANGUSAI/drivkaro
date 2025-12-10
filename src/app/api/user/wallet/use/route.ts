// src/app/api/user/wallet/use/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export async function POST(req: NextRequest) {
  const session = await (await dbConnect()).startSession();

  try {
    const { userId, bookingId, requestedAmount, usageType } = await req.json();
    // usageType: "BOOKING_PAYMENT" | "TIP_PAYMENT"

    if (!userId || !bookingId || !requestedAmount || requestedAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid request" },
        { status: 400 }
      );
    }

    if (!["BOOKING_PAYMENT", "TIP_PAYMENT"].includes(usageType)) {
      return NextResponse.json(
        { message: "Invalid usage type" },
        { status: 400 }
      );
    }

    session.startTransaction();

    const user = await User.findById(
      new mongoose.Types.ObjectId(userId)
    ).session(session);

    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const current = user.walletAmount || 0;
    if (current <= 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const amountToUse = Math.min(current, requestedAmount);

    user.walletAmount = current - amountToUse;
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

    return NextResponse.json({
      success: true,
      usedAmount: amountToUse,
      remainingWallet: user.walletAmount,
    });
  } catch (error: any) {
    console.error("Wallet use error:", error);
    await session.abortTransaction();
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
