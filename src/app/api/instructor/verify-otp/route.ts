import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { mobile, otp } = body;

    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "mobile and otp are required" },
        { status: 400 }
      );
    }

    // hash OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // find recent OTP
    const record = await Otp.findOne({
      phone: mobile,
      otpHash,
      used: { $ne: true },
      expiresAt: { $gt: new Date() }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // mark used
    record.used = true;
    await record.save();

    // find instructor
    let instructor = await Instructor.findOne({ mobile });

    if (!instructor) {
      instructor = await Instructor.create({
        mobile,
        status: "pending"
      });
    }

    return NextResponse.json({
      success: true,
      instructor,
      accessToken: "jwt_token_here"
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
