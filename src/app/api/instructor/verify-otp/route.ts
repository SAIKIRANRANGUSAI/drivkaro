import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();

    // ---------------- VALIDATIONS ----------------

    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "mobile and otp are required" },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format" },
        { status: 400 }
      );
    }

    // ---------------- FIND OTP ----------------

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const record = await Otp.findOne({
      phone: mobile,
      otpHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // ---------------- MARK USED ----------------
    record.used = true;
    await record.save();

    // ---------------- FIND INSTRUCTOR ----------------

    let instructor = await Instructor.findOne({ mobile });

    if (!instructor) {
      instructor = await Instructor.create({
        fullName: "",
        mobile,
        status: "pending",
      });
    }

    // ---------------- GENERATE JWT ----------------

    const tokenPayload = {
      id: instructor._id.toString(),
      mobile: instructor.mobile,
      role: "instructor",
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    // ---------------- RESPONSE ----------------

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      instructor: {
        id: instructor._id,
        fullName: instructor.fullName,
        mobile: instructor.mobile,
        status: instructor.status,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
