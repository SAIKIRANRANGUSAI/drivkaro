import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import AdminLog from "@/models/AdminLog";

export async function POST(req: Request) {
  await dbConnect();

  const body = await req.json();

  await AdminLog.create({
    ip: body.ip,
    browser: body.browser,
    os: body.os,
  });

  return NextResponse.json({ success: true });
}
