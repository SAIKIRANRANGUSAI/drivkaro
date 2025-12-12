import { NextResponse } from "next/server";

export async function POST() {
  // Clear cookie by setting to empty + expired date
  const res = NextResponse.json(
    {
      success: true,
      message: "Logged out successfully",
      data: null,
    },
    { status: 200 }
  );

  res.cookies.set("drivkaro_refresh", "", {
    httpOnly: true,
    path: "/api/auth/refresh-token",
    expires: new Date(0), // expires immediately
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Optional: Add a delay to simulate processing time for loader on client-side
  // (Client should handle the loader; server just responds)
  await new Promise(resolve => setTimeout(resolve, 500));

  return res;
}