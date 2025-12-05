import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import { connectDB } from "@/lib/mongoose";

export async function DELETE(req: Request) {
  try {
    await connectDB();

    // Extract Bearer Token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid token" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token); // Validate token

    if (!payload) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(payload.userId);

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR → ", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
