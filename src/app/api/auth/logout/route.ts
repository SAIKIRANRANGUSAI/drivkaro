import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" });

  res.cookies.set("drivkaro_refresh", "", {
    httpOnly: true,
    path: "/api/auth/refresh-token",
    expires: new Date(0),
  });

  return res;
}
