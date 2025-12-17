// New API Route: src/app/api/admin/logo/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import LogoSetting from "@/models/LogoSetting";

export async function GET() {
  try {
    await connectDB();

    const logo = await LogoSetting.findOne(); // Assumes single document; use findById if ID-based

    if (!logo) {
      return NextResponse.json(
        { success: false, message: "Logo not found", data: { logoUrl: "" } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: { logoUrl: logo.logoUrl } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logo fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", data: { logoUrl: "" } },
      { status: 500 }
    );
  }
}