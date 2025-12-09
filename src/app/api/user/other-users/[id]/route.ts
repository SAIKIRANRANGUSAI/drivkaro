import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

//
// GET
//
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    const { id } = await context.params;

    const other = await OtherUser.findById(id);

    if (!other || other.ownerUserId.toString() !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Fetched successfully",
        data: { other },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}

//
// PUT
//
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    const { id } = await context.params;
    const update = await req.json();

    const other = await OtherUser.findOneAndUpdate(
      { _id: id, ownerUserId: userId },
      update,
      { new: true }
    );

    if (!other) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Updated successfully",
        data: { other },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}

//
// DELETE
//
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

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

    const { id } = await context.params;

    const other = await OtherUser.findOneAndDelete({
      _id: id,
      ownerUserId: userId,
    });

    if (!other) {
      return NextResponse.json(
        {
          success: false,
          message: "Not found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Deleted successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}
