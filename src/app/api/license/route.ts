import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LicenseRequest from "@/models/DrivingLicenseRequest";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { bookingId, userId, driverId, wantsLicense } = await req.json();

  const reqDoc = await LicenseRequest.create({
    bookingId,
    userId,
    driverId,
    wantsLicense,
  });

  return NextResponse.json({ success: true, request: reqDoc });
}
