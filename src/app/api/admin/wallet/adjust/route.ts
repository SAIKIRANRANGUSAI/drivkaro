// src/app/api/admin/wallet/adjust/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export async function POST(req: NextRequest) {
  const session = await (await dbConnect()).startSession();

  try {
    // await requireAdmin(req);

    const { userId, amount, reason, referenceId } = await req.json();
    // amount: positive for credit (refund), negative only if admin wants to correct mistake

    if (!userId || !amount) {
      return NextResponse.json(
        { message: "userId and amount required" },
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

    const newBalance = (user.walletAmount || 0) + amount;

    if (newBalance < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { message: "Wallet cannot go negative" },
        { status: 400 }
      );
    }

    user.walletAmount = newBalance;
    await user.save({ session });

    await WalletTransaction.create(
      [
        {
          user: user._id,
          amount,
          type: amount > 0 ? "REFUND" : "ADMIN_ADJUSTMENT",
          referenceId,
          remark: reason || (amount > 0 ? "Refund" : "Admin adjustment"),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return NextResponse.json({ success: true, newBalance });
  } catch (error: any) {
    console.error("Admin wallet adjust error:", error);
    await session.abortTransaction();
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
