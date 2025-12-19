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

    let { fullName, email, gender, dob, usedReferralCode } = body;

    // ================= REQUIRED FIELDS =================
    if (!fullName || !email || !gender || !dob) {
      return NextResponse.json({
        success: false,
        code: "REQUIRED_FIELDS_MISSING",
        message: "fullName, email, gender and dob are required",
        data: null,
      });
    }

    // ================= NORMALIZE & VALIDATE GENDER =================
    gender = String(gender).toLowerCase();
    if (!["male", "female", "other"].includes(gender)) {
      return NextResponse.json({
        success: false,
        code: "INVALID_GENDER",
        message: "Gender must be male, female or other",
        data: null,
      });
    }

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
    user.fullName = fullName.trim();
    user.email = email.trim();
    user.gender = gender;
    user.dob = new Date(dob);

    // ================= REFERRAL (IGNORE EMPTY STRING) =================
    const referralCodeToApply =
      typeof usedReferralCode === "string" && usedReferralCode.trim()
        ? usedReferralCode.trim()
        : null;

    if (referralCodeToApply) {
      if (user.usedReferralCode) {
        return NextResponse.json({
          success: false,
          code: "REFERRAL_ALREADY_APPLIED",
          message: "Referral already applied",
          data: null,
        });
      }

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

      if (String(referrer._id) === String(user._id)) {
        return NextResponse.json({
          success: false,
          code: "REFERRAL_SELF_NOT_ALLOWED",
          message: "You cannot refer yourself",
          data: null,
        });
      }

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
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          gender: user.gender,
          dob: user.dob,
          walletAmount: user.walletAmount,
          myReferralCode: user.referralCode,
          usedReferralCode: user.usedReferralCode || null,
        },
        is_profile: true,
      },
    });
  } catch (err: any) {
    console.error("Profile Update Error:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: err.message || "Something went wrong",
      data: null,
    });
  }
}
