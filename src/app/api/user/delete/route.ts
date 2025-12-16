import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import { connectDB } from "@/lib/mongoose";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // ================= AUTH HEADER =================
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({
        success: false,
        code: "AUTH_HEADER_MISSING",
        message: "Missing or invalid Authorization header",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    // ================= TOKEN VERIFY =================
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

    // ================= DELETE USER =================
    const deletedUser = await User.findByIdAndDelete(decoded.userId);

    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found",
        data: null,
      });
    }

    // ================= SUCCESS =================
    return NextResponse.json({
      success: true,
      code: "ACCOUNT_DELETED",
      message: "Account deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("DELETE USER ERROR → ", error);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}
