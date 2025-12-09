import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header required" },
        { status: 400 }
      );
    }

    // OPTIONAL: If you store token/session in DB, remove it
    await Instructor.findByIdAndUpdate(instructorId, {
      $unset: { accessToken: "" }
    });

    // Clear frontend side (client should remove token)
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
