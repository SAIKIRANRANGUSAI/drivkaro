import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

//
// ================= GET OTHER USER =================
//
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    const other = await OtherUser.findById(id);

    if (!other || other.ownerUserId.toString() !== userId) {
      return NextResponse.json({
        success: false,
        code: "OTHER_USER_NOT_FOUND",
        message: "Other user not found",
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      code: "OTHER_USER_FETCHED",
      message: "Fetched successfully",
      data: { other },
    });
  } catch (err) {
    console.error("OTHER USER GET ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}

//
// ================= UPDATE OTHER USER =================
//
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const update = await req.json();

    const other = await OtherUser.findOneAndUpdate(
      { _id: id, ownerUserId: userId },
      update,
      { new: true }
    );

    if (!other) {
      return NextResponse.json({
        success: false,
        code: "OTHER_USER_NOT_FOUND",
        message: "Other user not found",
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      code: "OTHER_USER_UPDATED",
      message: "Updated successfully",
      data: { other },
    });
  } catch (err) {
    console.error("OTHER USER UPDATE ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}

//
// ================= DELETE OTHER USER =================
//
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    const other = await OtherUser.findOneAndDelete({
      _id: id,
      ownerUserId: userId,
    });

    if (!other) {
      return NextResponse.json({
        success: false,
        code: "OTHER_USER_NOT_FOUND",
        message: "Other user not found",
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      code: "OTHER_USER_DELETED",
      message: "Deleted successfully",
      data: null,
    });
  } catch (err) {
    console.error("OTHER USER DELETE ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}
