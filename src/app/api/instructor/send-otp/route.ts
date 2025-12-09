import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { mobile } = await req.json();

    // 🔍 Validate input
    if (!mobile) {
      return NextResponse.json(
        { success: false, message: "Mobile number is required" },
        { status: 400 }
      );
    }

    // 🔍 Validate format (10 digits)
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number" },
        { status: 400 }
      );
    }

    // ❌ Prevent multiple OTP requests in < 1 minute
    const existingOtp = await Otp.findOne({
      phone: mobile,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existingOtp) {
      const remaining =
        Math.floor((existingOtp.expiresAt.getTime() - Date.now()) / 1000);

      if (remaining > 60) {
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting new OTP`,
          },
          { status: 429 }
        );
      }
    }

    // 🔢 Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔐 Hash OTP
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // 💾 Save OTP record
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
      used: false,
    });

    // 👨‍🏫 Create instructor record if not exists
    let instructor = await Instructor.findOne({ mobile });

    if (!instructor) {
      instructor = await Instructor.create({
        fullName: "",
        mobile,
        status: "pending",
      });
    }

    // 📡 Log OTP only in development mode
    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 OTP (dev):", otp);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
