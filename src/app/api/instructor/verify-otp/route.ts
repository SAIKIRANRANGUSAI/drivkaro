import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import jwt from "jsonwebtoken";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const mobile = body?.mobile || "";
    const otp = body?.otp || "";

    // -----------------------------
    // VALIDATION (ALWAYS 200)
    // -----------------------------
    if (!mobile || !otp)
      return NextResponse.json(
        buildResponse(false, "mobile and otp are required"),
        { status: 200 }
      );

    if (!/^[6-9]\d{9}$/.test(mobile))
      return NextResponse.json(
        buildResponse(false, "Invalid mobile number"),
        { status: 200 }
      );

    // -----------------------------
    // STATIC TEST OTP
    // -----------------------------
    if (otp !== "1234")
      return NextResponse.json(
        buildResponse(false, "Invalid OTP"),
        { status: 200 }
      );

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
    // PROFILE COMPLETION CHECK
    // -----------------------------
    const profileCompleted = Boolean(
      instructor.fullName &&
      instructor.registrationNumber &&
      instructor.ownerName &&
      instructor.dlNumber &&
      (instructor.dlImageFrontUrl || instructor.dlImageBackUrl)
    );

    // -----------------------------
    // GENERATE ACCESS TOKEN
    // -----------------------------
    const accessToken = jwt.sign(
      {
        id: instructor._id.toString(),
        mobile: instructor.mobile,
        role: "instructor",
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // -----------------------------
    // RESPONSE
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "OTP verified successfully", {
        instructor: {
          id: instructor._id.toString(),
          fullName: instructor.fullName || "",
          mobile: instructor.mobile || "",
          status: instructor.status || "pending",
          profileCompleted,
          rejectionMessage: instructor.rejectionMessage || ""
        },
        accessToken
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
