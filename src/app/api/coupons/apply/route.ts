import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { code, amount } = await req.json();
    const userId = req.headers.get("x-user-id");

    if (!code || !amount || !userId) {
      return NextResponse.json(
        { success: false, message: "code, amount, userId required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const today = new Date();

    const coupon = await Coupon.findOne({
      code: cleanCode,
      active: true,
      from: { $lte: today },
      to: { $gte: today },
    });

    if (!coupon) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "Invalid or expired coupon",
        discount: 0,
        finalAmount: amount,
      });
    }

    // 1️⃣ Min Amount
    if (amount < coupon.minAmount) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: `Minimum amount ${coupon.minAmount} required`,
        discount: 0,
        finalAmount: amount,
      });
    }

    // 2️⃣ Usage limit
    const usage = coupon.usedBy.find(
      (u) => u.userId.toString() === userId
    );

    if (usage && usage.count >= coupon.maxUsagePerUser) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: "Usage limit reached",
        discount: 0,
        finalAmount: amount,
      });
    }

    // 3️⃣ Calculate Discount
    let discount = coupon.isPercent
      ? Math.round((amount * coupon.amount) / 100)
      : coupon.amount;

    if (discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    if (discount > amount) discount = amount;

    const finalAmount = amount - discount;

    // 4️⃣ Update usage counter
    if (!usage) {
      coupon.usedBy.push({ userId, count: 1 });
    } else {
      usage.count += 1;
    }

    await coupon.save();

    return NextResponse.json({
      success: true,
      valid: true,
      discount,
      finalAmount,
      message: "Coupon applied",
      remaining: coupon.maxUsagePerUser - (usage ? usage.count : 1),
    });

  } catch (err) {
    console.error("COUPON APPLY ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
