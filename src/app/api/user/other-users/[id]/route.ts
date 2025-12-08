import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

interface Params {
  id: string;
}

//
// GET — fetch one other-user
//
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const other = await OtherUser.findOne({
      _id: id,
      ownerUserId: userId,
    });

    if (!other) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      other,
    });
  } catch (err) {
    console.error("GET OTHER ERROR:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

//
// PUT — update other-user
//
export async function PUT(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const { id } = params;
    const body = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updated = await OtherUser.findOneAndUpdate(
      { _id: id, ownerUserId: userId },
      body,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      other: updated,
    });
  } catch (err) {
    console.error("UPDATE OTHER ERROR:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

//
// DELETE — delete other-user
//
export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const deleted = await OtherUser.findOneAndDelete({
      _id: id,
      ownerUserId: userId,
    });

    if (!deleted) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    console.error("DELETE OTHER ERROR:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
