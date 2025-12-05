import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

// POST: create an other-user for the logged in user
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fullName, mobile, gender, dob, notes } = body;

    if (!fullName || !mobile) {
      return NextResponse.json(
        { message: "fullName and mobile are required" },
        { status: 400 }
      );
    }

    const other = await OtherUser.create({
      ownerUserId: userId,
      fullName,
      mobile,
      gender,
      dob: dob ? new Date(dob) : undefined,
      notes,
    });

    return NextResponse.json(
      { success: true, other },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

// GET: list other-users for the logged-in user
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const others = await OtherUser.find({ ownerUserId: userId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ success: true, others });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
