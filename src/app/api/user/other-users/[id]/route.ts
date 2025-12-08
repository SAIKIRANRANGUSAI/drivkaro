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
  await connectDB();

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const other = await OtherUser.findById(id);

  if (!other || other.ownerUserId.toString() !== userId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, other });
}

//
// PUT
//
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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
}

//
// DELETE
//
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const other = await OtherUser.findOneAndDelete({
    _id: id,
    ownerUserId: userId,
  });

  if (!other) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Deleted" });
}
