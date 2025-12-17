import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile } = await req.json();

    // =========================
    // REQUEST VALIDATION
    // =========================
    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required",
        },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number",
        },
        { status: 422 }
      );
    }

    // =========================
    // MANUAL OTP (TEST MODE)
    // =========================
    const otp = "1234";
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // Remove any existing OTPs for this number
    await Otp.deleteMany({ phone: mobile });

    // Save new OTP
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      used: false,
    });

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        data: {
          otp, // ⚠️ REMOVE when SMS gateway is live
          expiresIn: 300,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
