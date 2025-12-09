import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const code = body?.code;
    const amount = Number(body?.amount);
    const userId = req.headers.get("x-user-id");
    // =========================================================
    // REQUIRED VALIDATIONS
    // =========================================================
    if (!code) {
      return NextResponse.json(
        { success: false, valid: false, message: "Coupon code required" },
        { status: 400 }
      );
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, valid: false, message: "Valid amount required" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, valid: false, message: "User ID required" },
        { status: 400 }
      );
    }
    const cleanCode = String(code).trim().toUpperCase();
    const today = new Date();
    // =========================================================
    // FIND VALID COUPON
    // =========================================================
    const coupon = await Coupon.findOne({
      code: cleanCode,
      active: true,
      from: { $lte: today },
      to: { $gte: today },
    });
    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "Invalid or expired coupon",
          discount: 0,
          finalAmount: amount,
        },
        { status: 200 }
      );
    }
    // =========================================================
    // MINIMUM AMOUNT CHECK
    // =========================================================
    if (amount < coupon.minAmount) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: `Minimum amount ₹${coupon.minAmount} required`,
          discount: 0,
          finalAmount: amount,
        },
        { status: 200 }
      );
    }
    // =========================================================
    // CHECK USAGE LIMIT
    // =========================================================
    const usage = coupon.usedBy.find(
      (u: any) => u.userId.toString() === userId
    );
    if (usage && usage.count >= coupon.maxUsagePerUser) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: "Coupon usage limit reached",
          discount: 0,
          finalAmount: amount,
        },
        { status: 200 }
      );
    }
    // =========================================================
    // CALCULATE DISCOUNT
    // =========================================================
    let discount = coupon.isPercent
      ? Math.round((amount * coupon.amount) / 100)
      : coupon.amount;
    // MAX DISCOUNT CAP
    discount = Math.min(discount, coupon.maxDiscount);
    // Prevent negative
    discount = Math.min(discount, amount);
    const finalAmount = amount - discount;
    // =========================================================
    // UPDATE USAGE COUNTER
    // =========================================================
    if (!usage) {
      coupon.usedBy.push({ userId, count: 1 });
    } else {
      usage.count += 1;
    }
    await coupon.save();
    const remaining = coupon.maxUsagePerUser - (usage ? usage.count : 1);
    // =========================================================
    // SUCCESS RESPONSE
    // =========================================================
    return NextResponse.json(
      {
        success: true,
        valid: true,
        message: "Coupon applied successfully",
        discount,
        finalAmount,
        remaining, // how many times user can still use
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("COUPON APPLY ERROR:", err);
    return NextResponse.json(
      { success: false, valid: false, message: "Server error" },
      { status: 500 }
    );
  }
}