import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LicenseRequest from "@/models/DrivingLicenseRequest";
import Booking from "@/models/Booking";
import { verifyAccessToken } from "@/lib/jwt";

function apiResponse(success: boolean, message: string, data: any = {}) {
  return NextResponse.json({ success, message, data }, { status: 200 });
}

// 🔹 Extract userId from token
function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;

  try {
    const decoded = verifyAccessToken(h.split(" ")[1]) as any;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromToken(req);
    if (!userId) return apiResponse(false, "Unauthorized — invalid token");

    // 🔹 Get latest active booking of this user
    const booking = await Booking.findOne({
      userId,
      status: { $in: ["ongoing", "completed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!booking) {
      return apiResponse(false, "No booking found for this user");
    }

    if (!booking.assignedInstructorId) {
      return apiResponse(false, "Instructor not assigned to this booking");
    }

    // 🔹 Prevent duplicate request for same booking
    const exists = await LicenseRequest.findOne({
      bookingId: booking.bookingId,
      userId,
    });

    if (exists) {
      return apiResponse(true, "License request already submitted", {
        requestId: exists._id.toString(),
        status: exists.status,
      });
    }

    // 🔹 Create license request automatically
    const reqDoc = await LicenseRequest.create({
      bookingId: booking.bookingId,
      userId,
      driverId: booking.assignedInstructorId,
      wantsLicense: true,
    });

    return apiResponse(true, "License request submitted", {
      requestId: reqDoc._id.toString(),
      bookingId: reqDoc.bookingId,
      driverId: reqDoc.driverId,
      status: reqDoc.status,
      createdAt: reqDoc.createdAt,
    });

  } catch (err) {
    console.error("LICENSE REQUEST ERROR:", err);
    return apiResponse(false, "Server error");
  }
}
