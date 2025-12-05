import { NextResponse } from "next/server";
import { authMiddleware } from "@/lib/auth";
import OtherUser from "@/models/OtherUser";
import connectDB from "@/lib/mongoose";

export async function POST(req) {
  try {
    await connectDB();
    const user = await authMiddleware(req);

    const { fullName, mobile, gender } = await req.json();

    if (!fullName || !mobile || !gender) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const other = await OtherUser.create({
      ownerUserId: user._id,
      fullName,
      mobile,
      gender
    });

    return NextResponse.json({ success: true, other });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
