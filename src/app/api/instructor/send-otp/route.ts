import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json(
        { success: false, message: "mobile is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Save to DB
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      used: false,
    });

    // Create instructor if not exists
    let instructor = await Instructor.findOne({ mobile });
    if (!instructor) {
      instructor = await Instructor.create({
        fullName: "",
        mobile,
        status: "pending",
      });
    }

    console.log("OTP for test:", otp);

    return NextResponse.json({
      success: true,
      otp, // give actual OTP for testing
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
