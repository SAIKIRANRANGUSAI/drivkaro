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

    // === AUTH ===
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    let decodedToken: any;
    try {
      decodedToken = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const decoded = decodedToken as TokenPayload;

    // === GET USER ===
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // === UPDATE PROFILE FIELDS ===
    if (typeof body.fullName === "string") user.fullName = body.fullName;
    if (typeof body.email === "string") user.email = body.email;
    if (typeof body.gender === "string") user.gender = body.gender;

    // ⭐ FIX: ACCEPT usedReferralCode INSTEAD OF referralCode
    const referralCodeToApply = body.usedReferralCode?.trim();

    if (referralCodeToApply) {
      // Already applied?
      if (user.usedReferralCode) {
        return NextResponse.json(
          { success: false, message: "Referral already applied" },
          { status: 400 }
        );
      }

      // Find referrer
      const referrer = await User.findOne({ referralCode: referralCodeToApply });

      if (!referrer) {
        return NextResponse.json(
          { success: false, message: "Invalid referral code" },
          { status: 400 }
        );
      }

      // Self referral block
      if (String(referrer._id) === String(user._id)) {
        return NextResponse.json(
          { success: false, message: "Cannot refer yourself" },
          { status: 400 }
        );
      }

      // Save mapping
      user.referredBy = referrer._id;
      user.usedReferralCode = referralCodeToApply;

      // Create referral row
      await Referral.create({
        referrer: referrer._id,
        referredUser: user._id,
        bonusAmount: Number(process.env.REFERRAL_BONUS || 100),
        status: "PENDING",
        bonusCredited: false,
      });
    }

    // === SAVE USER ===
    await user.save();

    // === RESPONSE ===
    return NextResponse.json(
      {
        success: true,
        message: referralCodeToApply
          ? "Referral applied & profile updated"
          : "Profile updated successfully",
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            mobile: user.mobile,
            email: user.email,
            gender: user.gender,
            walletAmount: user.walletAmount,
            myReferralCode: user.referralCode,
            usedReferralCode: user.usedReferralCode || null,
          },
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Profile Update Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error", error: err.message },
      { status: 500 }
    );
  }
}
