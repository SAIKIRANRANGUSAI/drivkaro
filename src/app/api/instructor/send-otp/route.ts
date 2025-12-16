import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";

// 🔹 standard response (ALWAYS 200)
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

    const body = await req.json().catch(() => ({}));
    const mobile = body?.mobile || "";

    // -----------------------------
    // VALIDATION (NO STATUS CODES)
    // -----------------------------
    if (!mobile) {
      return NextResponse.json(
        buildResponse(false, "Mobile number is required"),
        { status: 200 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        buildResponse(false, "Invalid mobile number"),
        { status: 200 }
      );
    }

    // -----------------------------
    // RATE LIMIT (OPTIONAL)
    // -----------------------------
    const existingOtp = await Otp.findOne({
      phone: mobile,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existingOtp) {
      const remaining = Math.floor(
        (existingOtp.expiresAt.getTime() - Date.now()) / 1000
      );

      if (remaining > 60) {
        return NextResponse.json(
          buildResponse(
            false,
            `Please wait ${remaining} seconds before requesting new OTP`
          ),
          { status: 200 }
        );
      }
    }

    // -----------------------------
    // GENERATE MANUAL OTP
    // -----------------------------
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      used: false,
    });

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
    // RESPONSE (MANUAL OTP FOR TESTING)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "OTP generated successfully (manual)", {
        mobile,
        otp,            // ✅ MANUAL OTP SHOWN
        expiresIn: 300, // seconds
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
