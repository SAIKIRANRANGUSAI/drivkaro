import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile } = await req.json();

    // =========================
    // REQUEST VALIDATION
    // =========================
    if (!mobile) {
      return NextResponse.json(
        { success: false, message: "Mobile number is required", data: [] },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number", data: [] },
        { status: 422 }
      );
    }

    // =========================
    // CHECK EXISTING OTP (ANTI-SPAM)
    // =========================
    const existingOtp = await Otp.findOne({
      phone: mobile,
      expiresAt: { $gt: new Date() },
    });

    if (existingOtp) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP already sent. Please wait before requesting again.",
          data: [
            {
              expiresIn: Math.floor(
                (existingOtp.expiresAt.getTime() - Date.now()) / 1000
              ),
            },
          ],
        },
        { status: 200 }
      );
    }

    // =========================
    // GENERATE OTP
    // =========================
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove old OTPs
    await Otp.deleteMany({ phone: mobile });

    // Save new OTP
    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });

    // TODO: Send SMS here

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        data: [
          {
            ...(process.env.NODE_ENV !== "production" && { otp }), // hide in prod
            expiresIn: 300,
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: [],
      },
      { status: 500 }
    );
  }
}
