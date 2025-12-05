import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import crypto from "crypto";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();
    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Find OTP record
    const record = await Otp.findOne({ phone: mobile, used: false });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "OTP expired or not found" },
        { status: 400 }
      );
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired" },
        { status: 400 }
      );
    }

    // Compare OTP
    if (record.otpHash !== otpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    // Create / Find user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile });
    }

    // Generate access & refresh tokens
    const accessToken = signAccessToken({ userId: user._id, mobile });
    const refreshToken = signRefreshToken({ userId: user._id, mobile });

    const res = NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      user,
      accessToken,
    });

    res.cookies.set("drivkaro_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh-token",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
