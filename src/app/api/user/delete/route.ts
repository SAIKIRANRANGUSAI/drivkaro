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

    // === VALIDATE AUTH HEADER ===
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid Authorization header",
          data: null,
        },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // === VERIFY TOKEN ===
    let rawPayload: any;
    try {
      rawPayload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired access token",
          data: null,
        },
        { status: 401 }
      );
    }

    const payload = rawPayload as TokenPayload;

    if (!payload?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token payload",
          data: null,
        },
        { status: 401 }
      );
    }

    // === DELETE USER ===
    const deleted = await User.findByIdAndDelete(payload.userId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE USER ERROR → ", error);

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
