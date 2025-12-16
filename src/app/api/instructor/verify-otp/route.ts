import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Otp from "@/models/Otp";
import Instructor from "@/models/Instructor";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

    const body = await req.json().catch(() => ({}));
    const mobile = body?.mobile || "";
    const otp = body?.otp || "";

    // -----------------------------
    // VALIDATIONS (APP FRIENDLY)
    // -----------------------------
    if (!mobile || !otp) {
      return NextResponse.json(
        buildResponse(false, "mobile and otp are required"),
        { status: 200 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        buildResponse(false, "Invalid mobile number"),
        { status: 200 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        buildResponse(false, "Invalid OTP format"),
        { status: 200 }
      );
    }

    // -----------------------------
    // FIND OTP
    // -----------------------------
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const record = await Otp.findOne({
      phone: mobile,
      otpHash,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return NextResponse.json(
        buildResponse(false, "Invalid or expired OTP"),
        { status: 200 }
      );
    }

    // -----------------------------
    // MARK OTP AS USED
    // -----------------------------
    record.used = true;
    await record.save();

    // -----------------------------
    // FIND / CREATE INSTRUCTOR
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
    // GENERATE JWT
    // -----------------------------
    const tokenPayload = {
      id: instructor._id.toString(),
      mobile: instructor.mobile,
      role: "instructor",
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // -----------------------------
    // RESPONSE (ALWAYS 200, NO NULLS)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "OTP verified successfully", {
        instructor: {
          id: instructor._id.toString(),
          fullName: instructor.fullName || "",
          mobile: instructor.mobile || "",
          status: instructor.status || "",
        },
        accessToken: accessToken || "",
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Verify OTP error:", err);

    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
