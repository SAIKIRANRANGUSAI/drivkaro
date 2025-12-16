import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

// 🔹 utility: convert null / undefined → empty
function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj).forEach((key) => {
    clean[key] =
      obj[key] === null || obj[key] === undefined ? "" : obj[key];
  });
  return clean;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ⚠️ TEMP USER (replace later with auth user)
    const user = { _id: "dummy-user" };

    const { fullName, mobile, gender } = await req.json();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!fullName || !mobile || !gender) {
      return NextResponse.json(
        {
          success: false,
          message: "fullName, mobile and gender are required",
          data: {},
        },
        { status: 400 }
      );
    }

    // Mobile validation (India – optional but recommended)
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number",
          data: {},
        },
        { status: 422 }
      );
    }

    // -----------------------------
    // CREATE OTHER USER
    // -----------------------------
    const otherUser = await OtherUser.create({
      ownerUserId: user._id,
      fullName,
      mobile,
      gender,
    });

    // -----------------------------
    // RESPONSE (APP FRIENDLY)
    // -----------------------------
    return NextResponse.json(
      {
        success: true,
        message: "Other user created successfully",
        data: sanitize({
          id: otherUser._id.toString(),
          fullName: otherUser.fullName,
          mobile: otherUser.mobile,
          gender: otherUser.gender,
        }),
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Create other user error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: {},
      },
      { status: 500 }
    );
  }
}
