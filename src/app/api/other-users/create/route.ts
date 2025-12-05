import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import OtherUser from "@/models/OtherUser";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // TEMP user fallback
    const user = { _id: "dummy-user" };

    const { fullName, mobile, gender } = await req.json();

    if (!fullName || !mobile || !gender) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    const other = await OtherUser.create({
      ownerUserId: user._id,
      fullName,
      mobile,
      gender,
    });

    return NextResponse.json({ success: true, other });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
