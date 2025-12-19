import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";
import { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // === EXTRACT TOKEN FROM HEADER ===
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({
        success: false,
        code: "AUTH_HEADER_MISSING",
        message: "Missing Authorization header",
        data: null,
      });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return NextResponse.json({
        success: false,
        code: "AUTH_HEADER_INVALID",
        message: "Authorization header must be 'Bearer <token>'",
        data: null,
      });
    }

    const token = parts[1];

    // === VERIFY TOKEN ===
    let decoded: TokenPayload;
    try {
      decoded = verifyAccessToken(token) as TokenPayload;
    } catch {
      return NextResponse.json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Invalid or expired access token",
        data: null,
      });
    }

    if (!decoded?.userId) {
      return NextResponse.json({
        success: false,
        code: "TOKEN_PAYLOAD_INVALID",
        message: "Invalid token payload",
        data: null,
      });
    }

    // === FIND USER ===
    const user = await User.findById(decoded.userId).select("-__v");

    if (!user) {
      return NextResponse.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
      });
    }

    // === PROFILE COMPLETION CHECK ===
    const isProfile =
      Boolean(user.fullName) &&
      Boolean(user.email) &&
      Boolean(user.gender) &&
      Boolean(user.dob);

    // === SUCCESS RESPONSE ===
    return NextResponse.json({
      success: true,
      code: "USER_FETCHED",
      message: "User fetched successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          mobile: user.mobile,
          email: user.email,
          gender: user.gender,
          dob: user.dob,
          profileImage: user.profileImage || null,
          walletAmount: user.walletAmount,
          myReferralCode: user.referralCode,
          usedReferralCode: user.usedReferralCode || null,
          is_profile: isProfile, // ✅ IMPORTANT
        },
      },
    });
  } catch (err) {
    console.error("Get User Error:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}
