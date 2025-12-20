import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Banner from "@/models/Banner";

export async function GET() {
  await connectDB();

  const banners = await Banner.find({ active: true })
    .sort({ index: 1 })
    .lean();

  return NextResponse.json(
    {
      success: true,
      message: "Banners fetched",
      data: banners || [],
    },
    { status: 200 }
  );
}
