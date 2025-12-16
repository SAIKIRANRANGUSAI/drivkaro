// src/app/api/user/update-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Referral from "@/models/Referral";
import { verifyAccessToken } from "@/lib/jwt";
import { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // ================= AUTH =================
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Authorization token required",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token) as TokenPayload;
    } catch {
      return NextResponse.json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Invalid or expired token",
        data: null,
      });
    }

    // ================= GET USER =================
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
      });
    }

    // ================= UPDATE PROFILE =================
    if (typeof body.fullName === "string") user.fullName = body.fullName;
    if (typeof body.email === "string") user.email = body.email;
    if (typeof body.gender === "string") user.gender = body.gender;

    // ================= REFERRAL =================
    const referralCodeToApply = body.usedReferralCode?.trim();

    if (referralCodeToApply) {
      // Already applied
      if (user.usedReferralCode) {
        return NextResponse.json({
          success: false,
          code: "REFERRAL_ALREADY_APPLIED",
          message: "Referral already applied",
          data: null,
        });
      }

      // Find referrer
      const referrer = await User.findOne({
        referralCode: referralCodeToApply,
      });

      if (!referrer) {
        return NextResponse.json({
          success: false,
          code: "REFERRAL_INVALID",
          message: "Invalid referral code",
          data: null,
        });
      }

      // Self referral check
      if (String(referrer._id) === String(user._id)) {
        return NextResponse.json({
          success: false,
          code: "REFERRAL_SELF_NOT_ALLOWED",
          message: "You cannot refer yourself",
          data: null,
        });
      }

      // Save referral info
      user.referredBy = referrer._id;
      user.usedReferralCode = referralCodeToApply;

      await Referral.create({
        referrer: referrer._id,
        referredUser: user._id,
        bonusAmount: Number(process.env.REFERRAL_BONUS || 100),
        status: "PENDING",
        bonusCredited: false,
      });
    }

    // ================= SAVE USER =================
    await user.save();

    // ================= SUCCESS =================
    return NextResponse.json({
      success: true,
      code: "PROFILE_UPDATED",
      message: referralCodeToApply
        ? "Referral applied & profile updated successfully"
        : "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          gender: user.gender,
          walletAmount: user.walletAmount,
          myReferralCode: user.referralCode,
          usedReferralCode: user.usedReferralCode || null,
        },
      },
    });
  } catch (err: any) {
    console.error("Profile Update Error:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong",
      data: null,
    });
  }
}
