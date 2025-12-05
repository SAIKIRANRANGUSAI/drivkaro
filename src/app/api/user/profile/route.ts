import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("-__v");
    if (!user)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
