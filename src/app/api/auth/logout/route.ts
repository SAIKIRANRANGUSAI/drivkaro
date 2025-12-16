import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
      data: [],
    },
    { status: 200 }
  );

  // Clear refresh token cookie
  res.cookies.set("drivkaro_refresh", "", {
    httpOnly: true,
    path: "/api/auth/refresh-token",
    expires: new Date(0), // expire immediately
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
