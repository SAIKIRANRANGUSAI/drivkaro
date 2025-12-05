import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const other = await OtherUser.findById(params.id);
    if (!other || other.ownerUserId.toString() !== userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, other });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const update = await req.json();
    const other = await OtherUser.findOneAndUpdate(
      { _id: params.id, ownerUserId: userId },
      update,
      { new: true }
    );
    if (!other) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, other });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const other = await OtherUser.findOneAndDelete({ _id: params.id, ownerUserId: userId });
    if (!other) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
