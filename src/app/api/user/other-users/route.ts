import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

//
// ================= ADD OTHER USER =================
//
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "USER_ID_MISSING",
        message: "Missing x-user-id header",
        data: null,
      });
    }

    const { fullName, mobile, gender, dob, notes } = await req.json();

    if (!fullName || !mobile) {
      return NextResponse.json({
        success: false,
        code: "REQUIRED_FIELDS_MISSING",
        message: "fullName and mobile are required",
        data: null,
      });
    }

    // ================= OPTIONAL: DUPLICATE CHECK =================
    const existing = await OtherUser.findOne({
      ownerUserId: userId,
      mobile,
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        code: "DUPLICATE_MOBILE",
        message: "This mobile number is already added",
        data: null,
      });
    }

    const other = await OtherUser.create({
      ownerUserId: userId,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      gender,
      dob: dob ? new Date(dob) : undefined,
      notes: notes?.trim(),
    });

    return NextResponse.json({
      success: true,
      code: "OTHER_USER_CREATED",
      message: "Added successfully",
      data: {
        other,
      },
    });
  } catch (err) {
    console.error("OTHER USER CREATE ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}

//
// ================= LIST OTHER USERS (WITH PAGINATION) =================
//
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "USER_ID_MISSING",
        message: "Missing x-user-id header",
        data: null,
      });
    }

    // ================= OPTIONAL: PAGINATION =================
    const page = Number(req.nextUrl.searchParams.get("page") || 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") || 10);
    const skip = (page - 1) * limit;

    const [others, total] = await Promise.all([
      OtherUser.find({ ownerUserId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      OtherUser.countDocuments({ ownerUserId: userId }),
    ]);

    return NextResponse.json({
      success: true,
      code: "OTHER_USERS_FETCHED",
      message: "Fetched successfully",
      data: {
        others,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("OTHER USER FETCH ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}
