import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Parse body
    const { mobile } = await req.json();

    // ===== VALIDATION =====
    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required",
          data: null,
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number",
          data: null,
        },
        { status: 422 }
      );
    }

    // ===== OTP GENERATION =====
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove existing
    await Otp.deleteMany({ phone: mobile });

    // Save new OTP
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    });

    // TODO: Send SMS here

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        data: {
          otp, // remove in prod
          expiresIn: 300, // 5 mins
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: null,
      },
      { status: 500 }
    );
  }
}
