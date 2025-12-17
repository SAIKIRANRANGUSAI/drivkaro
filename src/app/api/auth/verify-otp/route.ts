import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import User from "@/models/User";
import crypto from "crypto";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

// --- HELPER: generate unique referral code ---
async function generateUniqueReferralCode() {
  while (true) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();

    // =========================
    // REQUEST VALIDATION
    // =========================
    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "Mobile and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number" },
        { status: 422 }
      );
    }

    // ✅ FIX: accept 4-digit OTP (manual mode)
    if (!/^\d{4}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format" },
        { status: 422 }
      );
    }

    // =========================
    // FIND OTP RECORD
    // =========================
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const record = await Otp.findOne({
      phone: mobile,
      used: false,
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "OTP expired or not found" },
        { status: 200 }
      );
    }

    // =========================
    // EXPIRY CHECK
    // =========================
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "OTP expired" },
        { status: 200 }
      );
    }

    // =========================
    // OTP MATCH CHECK
    // =========================
    if (record.otpHash !== otpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 200 }
      );
    }

    // =========================
    // MARK OTP USED
    // =========================
    record.used = true;
    await record.save();

    // =========================
    // FIND OR CREATE USER
    // =========================
    let user = await User.findOne({ mobile });

    if (!user) {
      const referralCode = await generateUniqueReferralCode();
      user = await User.create({
        mobile,
        referralCode,
        walletAmount: 0,
      });
    } else if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    // =========================
    // REFERRAL INFO
    // =========================
    let usedReferralCode = null;
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy).select(
        "referralCode"
      );
      usedReferralCode = referrer?.referralCode || null;
    }

    // =========================
    // TOKENS
    // =========================
    const accessToken = signAccessToken({
      userId: user._id,
      mobile,
    });

    const refreshToken = signRefreshToken({
      userId: user._id,
      mobile,
    });

    // =========================
    // RESPONSE
    // =========================
    const res = NextResponse.json(
      {
        success: true,
        message: "OTP verified successfully",
        data: {
          user: {
            _id: user._id,
            mobile: user.mobile,
            myReferralCode: user.referralCode,
            usedReferralCode,
            walletAmount: user.walletAmount || 0,
          },
          accessToken,
        },
      },
      { status: 200 }
    );

    // =========================
    // SET REFRESH COOKIE
    // =========================
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
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
