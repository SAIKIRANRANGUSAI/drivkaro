import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const { code, amount, isPercent, from, to } = body;

  const coupon = await Coupon.create({
    code,
    amount,
    isPercent,
    active: true,
    from: new Date(from),
    to: new Date(to)
  });

  return NextResponse.json({ success: true, coupon });
}

export async function GET() {
  await connectDB();
  const coupons = await Coupon.find();
  return NextResponse.json({ success: true, coupons });
}
