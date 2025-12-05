import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  await connectDB();
  
  const { code, amount } = await req.json();
  const today = new Date();

  const coupon = await Coupon.findOne({
    code,
    active: true,
    from: { $lte: today },
    to: { $gte: today },
  });

  if (!coupon) {
    return NextResponse.json({ valid: false, discount: 0 });
  }

  const discount = coupon.isPercent
    ? Math.round((amount * coupon.amount) / 100)
    : coupon.amount;

  return NextResponse.json({ valid: true, discount });
}
