import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import crypto from "crypto";

export async function POST(req: Request) {
  await connectDB();
  const { mobile } = await req.json();

  if (!mobile) {
    return NextResponse.json(
      { success: false, message: "Mobile number is required" },
      { status: 400 }
    );
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  // Remove existing unused OTPs for same number (optional cleanup)
  await Otp.deleteMany({ phone: mobile });

  // Save new OTP
  await Otp.create({
    phone: mobile,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
  });

  // TODO: Send SMS here
  return NextResponse.json({
    success: true,
    message: "OTP sent successfully",
    otp, // remove in production
  });
}
