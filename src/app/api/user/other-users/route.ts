import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // === USER VALIDATION ===
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing x-user-id header",
          data: null,
        },
        { status: 401 }
      );
    }

    // === BODY ===
    const { fullName, mobile, gender, dob, notes } = await req.json();

    // === FIELD VALIDATION ===
    if (!fullName || !mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "fullName and mobile are required",
          data: null,
        },
        { status: 400 }
      );
    }

    // === CREATE OTHER USER ===
    const other = await OtherUser.create({
      ownerUserId: userId,
      fullName,
      mobile,
      gender,
      dob: dob ? new Date(dob) : undefined,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Added successfully",
        data: {
          other,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("OTHER USER CREATE ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: null,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // === USER VALIDATION ===
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing x-user-id header",
          data: null,
        },
        { status: 401 }
      );
    }

    // === FIND ===
    const others = await OtherUser.find({ ownerUserId: userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Fetched successfully",
        data: {
          others,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("OTHER USER FETCH ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: null,
      },
      { status: 500 }
    );
  }
}
