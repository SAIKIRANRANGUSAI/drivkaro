import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const cookie = req.headers.get("cookie") || "";
    const refreshToken = cookie
      .split("; ")
      .find((c) => c.startsWith("drivkaro_refresh="))
      ?.split("=")[1];

    if (!refreshToken)
      return NextResponse.json({ success: false, message: "No refresh token" }, { status: 401 });

    const decoded: any = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user)
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const newAccessToken = signAccessToken({ userId: user._id, mobile: user.mobile });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Invalid refresh token" }, { status: 401 });
  }
}
