// src/app/api/user/wallet/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 👉 TEMP auth via query (as you already have)
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "User not authorized",
        data: null,
      });
    }

    const user = await User.findById(userId).select("walletAmount");
    if (!user) {
      return NextResponse.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
      });
    }

    const transactions = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // ================= SUCCESS =================
    return NextResponse.json({
      success: true,
      code: "WALLET_FETCHED",
      message: "Wallet details fetched successfully",
      data: {
        walletAmount: user.walletAmount || 0,
        transactions,
      },
    });
  } catch (error: any) {
    console.error("Wallet GET error:", error);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong",
      data: null,
    });
  }
}
