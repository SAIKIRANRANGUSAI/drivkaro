import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

interface Params {
  id: string;
}

//
// GET
//
export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const other = await OtherUser.findById(id);

    if (!other || other.ownerUserId.toString() !== userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, other });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

//
// PUT
//
export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();

    const other = await OtherUser.findOneAndUpdate(
      { _id: id, ownerUserId: userId },
      update,
      { new: true }
    );

    if (!other) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, other });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

//
// DELETE
//
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const other = await OtherUser.findOneAndDelete({
      _id: id,
      ownerUserId: userId,
    });

    if (!other) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Deleted" });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
