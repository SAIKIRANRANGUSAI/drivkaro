import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const mobile = body?.mobile || "";

    // -----------------------------
    // VALIDATION (ALWAYS 200)
    // -----------------------------
    if (!mobile)
      return NextResponse.json(
        buildResponse(false, "Mobile number is required"),
        { status: 200 }
      );

    if (!/^[6-9]\d{9}$/.test(mobile))
      return NextResponse.json(
        buildResponse(false, "Invalid mobile number"),
        { status: 200 }
      );

    // -----------------------------
    // ENSURE INSTRUCTOR EXISTS
    // -----------------------------
    let instructor = await Instructor.findOne({ mobile });

    if (!instructor) {
      instructor = await Instructor.create({
        fullName: "",
        mobile,
        status: "pending",
      });
    }

    // -----------------------------
    // STATIC TEST OTP
    // -----------------------------
    const otp = "1234";

    return NextResponse.json(
      buildResponse(true, "OTP generated successfully", {
        mobile,
        otp,   // <-- visible for testing only
        note: "Static OTP enabled for development",
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Send OTP error:", err);

    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
