import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";

// 🔹 utility: safe response object
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

    const { mobile } = await req.json();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!mobile) {
      return NextResponse.json(
        buildResponse(false, "Mobile number is required"),
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        buildResponse(false, "Invalid mobile number"),
        { status: 422 }
      );
    }

    // -----------------------------
    // RATE LIMIT (1 OTP / minute)
    // -----------------------------
    const existingOtp = await Otp.findOne({
      phone: mobile,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existingOtp) {
      const remainingSeconds = Math.floor(
        (existingOtp.expiresAt.getTime() - Date.now()) / 1000
      );

      if (remainingSeconds > 60) {
        return NextResponse.json(
          buildResponse(
            false,
            `Please wait ${remainingSeconds} seconds before requesting new OTP`
          ),
          { status: 429 }
        );
      }
    }

    // -----------------------------
    // GENERATE OTP
    // -----------------------------
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await Otp.create({
      phone: mobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
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
    // DEV LOG ONLY
    // -----------------------------
    if (process.env.NODE_ENV !== "production") {
      console.log("🔐 OTP (dev only):", otp);
    }

    // -----------------------------
    // RESPONSE (APP FRIENDLY)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "OTP sent successfully", {
        mobile,
        expiresIn: 300, // seconds
        otp:
          process.env.NODE_ENV === "production"
            ? ""
            : otp, // dev only
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 500 }
    );
  }
}
