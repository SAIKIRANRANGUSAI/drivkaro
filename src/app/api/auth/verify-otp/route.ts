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

    // === VALIDATION ===
    if (!mobile || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile and OTP are required",
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

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP format",
          data: null,
        },
        { status: 422 }
      );
    }

    // === FIND OTP ===
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const record = await Otp.findOne({ phone: mobile, used: false });

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP expired or not found",
          data: null,
        },
        { status: 400 }
      );
    }

    // === EXPIRY CHECK ===
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP expired",
          data: null,
        },
        { status: 400 }
      );
    }

    // === HASH COMPARE ===
    if (record.otpHash !== otpHash) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP",
          data: null,
        },
        { status: 400 }
      );
    }

    // === MARK USED ===
    record.used = true;
    await record.save();

    // === FIND OR CREATE USER ===
    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile });
    }

    // === TOKENS ===
    const accessToken = signAccessToken({ userId: user._id, mobile });
    const refreshToken = signRefreshToken({ userId: user._id, mobile });

    // === RESPONSE ===
    const res = NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
        data: {
          user,
          accessToken,
        },
      },
      { status: 200 }
    );

    // === SET REFRESH COOKIE ===
    res.cookies.set("drivkaro_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh-token",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Verify OTP Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: null,
      },
      { status: 500 }
    );
  }
}
