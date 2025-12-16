import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LicenseRequest from "@/models/DrivingLicenseRequest";

// 📌 Unified 200 response helper
function apiResponse(
  success: boolean,
  message: string,
  data: Record<string, any> = {}
) {
  return NextResponse.json(
    {
      success,
      message,
      data,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { bookingId, userId, driverId, wantsLicense } = await req.json();

    // ---------------- VALIDATION ----------------
    if (!bookingId || !userId || !driverId) {
      return apiResponse(false, "bookingId, userId and driverId are required");
    }

    // ---------------- CREATE REQUEST ----------------
    const reqDoc = await LicenseRequest.create({
      bookingId,
      userId,
      driverId,
      wantsLicense: Boolean(wantsLicense),
    });

    return apiResponse(true, "License request submitted", {
      requestId: reqDoc._id?.toString() || "",
      bookingId: reqDoc.bookingId || "",
      userId: reqDoc.userId || "",
      driverId: reqDoc.driverId || "",
      wantsLicense: reqDoc.wantsLicense ?? false,
      status: reqDoc.status || "pending",
      createdAt: reqDoc.createdAt || "",
    });

  } catch (error) {
    console.error("LICENSE REQUEST ERROR:", error);
    return apiResponse(false, "Server error");
  }
}
