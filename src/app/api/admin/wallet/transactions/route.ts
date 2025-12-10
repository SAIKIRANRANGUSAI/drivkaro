// src/app/api/admin/wallet/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WalletTransaction from "@/models/WalletTransaction";
// import { requireAdmin } from "@/lib/auth"; // your custom admin check

export async function GET(req: NextRequest) {
  try {
    // Connect to DB
    await connectDB();

    // Admin Auth check (optional)
    // await requireAdmin(req);

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const limit = Number(searchParams.get("limit") || 50);

    const query: any = {};
    if (userId) query.user = userId;
    if (type) query.type = type;

    const txns = await WalletTransaction.find(query)
      .populate("user", "fullName mobile")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ transactions: txns });
  } catch (error: any) {
    console.error("Admin wallet transactions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
