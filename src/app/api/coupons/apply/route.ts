import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

// 📌 Unified 200 response helper
function apiResponse(
  success: boolean,
  message: string,
  data: Record<string, any> = {}
) {
  return NextResponse.json(
    {
      success,
      message,
      data,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { code, amount } = await req.json();
    const userId = req.headers.get("x-user-id");

    // ---------------- REQUIRED ----------------
    if (!code) {
      return apiResponse(false, "Coupon code required");
    }

    if (amount == null || isNaN(amount)) {
      return apiResponse(false, "Valid amount required");
    }

    if (!userId) {
      return apiResponse(false, "User ID required");
    }

    const cleanCode = String(code).trim().toUpperCase();
    const today = new Date();

    // ---------------- FIND VALID COUPON ----------------
    const coupon = await Coupon.findOne({
      code: cleanCode,
      active: true,
      from: { $lte: today },
      to: { $gte: today },
    });

    if (!coupon) {
      return apiResponse(false, "Invalid or expired coupon", {
        valid: false,
        discount: 0,
        finalAmount: amount || 0,
        remaining: 0,
      });
    }

    // ---------------- MIN AMOUNT ----------------
    if (amount < coupon.minAmount) {
      return apiResponse(false, `Minimum amount ₹${coupon.minAmount} required`, {
        valid: false,
        discount: 0,
        finalAmount: amount,
        remaining: coupon.maxUsagePerUser || 0,
      });
    }

    // ---------------- USAGE LIMIT ----------------
    const usage = coupon.usedBy.find(
      (u: { userId: any; count: number }) =>
        u.userId.toString() === userId
    );

    if (usage && usage.count >= coupon.maxUsagePerUser) {
      return apiResponse(false, "Coupon usage limit reached", {
        valid: false,
        discount: 0,
        finalAmount: amount,
        remaining: 0,
      });
    }

    // ---------------- CALCULATE DISCOUNT ----------------
    let discount = coupon.isPercent
      ? Math.round((amount * coupon.amount) / 100)
      : coupon.amount;

    if (discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    if (discount > amount) discount = amount;

    const finalAmount = amount - discount;

    // ---------------- UPDATE USAGE ----------------
    if (!usage) {
      coupon.usedBy.push({ userId, count: 1 });
    } else {
      usage.count += 1;
    }

    await coupon.save();

    const remaining =
      coupon.maxUsagePerUser -
      (usage ? usage.count : 1);

    return apiResponse(true, "Coupon applied", {
      valid: true,
      couponCode: cleanCode,
      discount: discount || 0,
      finalAmount: finalAmount || 0,
      remaining: remaining > 0 ? remaining : 0,
    });

  } catch (error) {
    console.error("COUPON APPLY ERROR:", error);
    return apiResponse(false, "Server error");
  }
}
