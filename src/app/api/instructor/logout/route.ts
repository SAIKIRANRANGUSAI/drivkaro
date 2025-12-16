import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

// 🔹 utility: standard response (ALWAYS 200)
function buildResponse(
  success: boolean,
  message: string,
  data: any = {}
) {
  return { success, message, data };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = req.headers.get("x-instructor-id") || "";

    // -----------------------------
    // VALIDATION (APP FRIENDLY)
    // -----------------------------
    if (!instructorId) {
      return NextResponse.json(
        buildResponse(false, "x-instructor-id header required"),
        { status: 200 }
      );
    }

    // -----------------------------
    // LOGOUT ACTION
    // -----------------------------
    // JWT is stateless → client must remove token
    // DB cleanup is optional and safe
    await Instructor.findByIdAndUpdate(instructorId, {
      $unset: { accessToken: "" },
    });

    // -----------------------------
    // RESPONSE (NO NULLS, ALWAYS 200)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "Logged out successfully", {}),
      { status: 200 }
    );

  } catch (err) {
    console.error("Logout error:", err);

    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
