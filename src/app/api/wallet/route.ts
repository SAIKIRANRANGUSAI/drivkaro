import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { verifyAccessToken } from "@/lib/jwt";

function getUserId(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: {} },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found", data: {} },
        { status: 404 }
      );
    }

    const txns = await WalletTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Wallet data fetched",
        data: {
          walletAmount: user.walletAmount || 0,
          transactions: txns.map((t: any) => ({
            id: t._id?.toString(),
            amount: t.amount,
            type: t.type,
            referenceId: t.referenceId || "",
            remark: t.remark || "",
            createdAt: t.createdAt,
          })),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("WALLET API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
