// src/app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" });
  res.headers.set("Set-Cookie", `admin_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res;
}
