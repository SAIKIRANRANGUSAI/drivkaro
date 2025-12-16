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
          data: [],
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number",
          data: [],
        },
        { status: 422 }
      );
    }

    // =========================
    // MANUAL OTP GENERATION
    // =========================
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove existing OTPs
    await Otp.deleteMany({ phone: mobile });

    // Save new OTP
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      used: false,
    });

    // =========================
    // RESPONSE (MANUAL OTP MODE)
    // =========================
    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        data: [
          {
            otp,          // ⚠️ MANUAL OTP (REMOVE WHEN SMS GATEWAY IS ADDED)
            expiresIn: 300,
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: [],
      },
      { status: 500 }
    );
  }
}
