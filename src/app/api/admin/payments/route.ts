import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Payment from "@/models/Payment";

export async function GET() {
  await connectDB();

  const payments = await Payment.find({})
    .populate("bookingId")
    .populate("userId")
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, payments });
}
