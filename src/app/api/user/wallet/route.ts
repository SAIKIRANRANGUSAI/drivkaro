// src/app/api/user/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";

import WalletTransaction from "@/models/WalletTransaction";
import User from "@/models/User";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 👉 Replace with actual auth
    const userId = req.nextUrl.searchParams.get("userId");
    // const session = await getServerSession(authOptions);
    // const userId = session?.user.id;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId).select("walletAmount");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const txns = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      walletAmount: user.walletAmount || 0,
      transactions: txns,
    });
  } catch (error: any) {
    console.error("Wallet GET error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
