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
      return NextResponse.json(
        {
          success: false,
          message: "Missing Authorization header",
          data: null,
        },
        { status: 401 }
      );
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return NextResponse.json(
        {
          success: false,
          message: "Authorization header format must be 'Bearer <token>'",
          data: null,
        },
        { status: 401 }
      );
    }

    const token = parts[1];

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

    const decoded = rawPayload as TokenPayload;
    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token payload",
          data: null,
        },
        { status: 401 }
      );
    }

    // === FIND USER ===
    const user = await User.findById(decoded.userId).select("-__v");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          data: null,
        },
        { status: 404 }
      );
    }

    // === SUCCESS RESPONSE ===
    return NextResponse.json(
      {
        success: true,
        message: "User fetched successfully",
        data: {
          user,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Get User Error:", err);

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
