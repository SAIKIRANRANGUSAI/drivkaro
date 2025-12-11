import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";

// Force Mongoose to load schemas
import "@/models/Instructor";
import "@/models/User";
import "@/models/DrivingLicenseRequest";

import LicenseRequest from "@/models/DrivingLicenseRequest";

export async function GET() {
  try {
    await connectDB();

    const data = await LicenseRequest.find()
      .populate("userId", "fullName mobile")
      .populate("driverId", "fullName mobile")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Admin license fetch error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
