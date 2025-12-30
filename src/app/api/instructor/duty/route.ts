import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

/* ========== GET — FETCH CURRENT DUTY STATUS ========== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = getInstructorId(req);
    const instructor = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(buildResponse(false, "Instructor not found"), { status: 200 });

    return NextResponse.json(
      buildResponse(true, "Duty status fetched", {
        dutyStatus: instructor.dutyStatus || "offline",
        lastActiveAt: instructor.lastActiveAt || null
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("duty get error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}

/* ========== POST — UPDATE DUTY STATUS (online/offline/busy) ========== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = getInstructorId(req);
    const instructor = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(buildResponse(false, "Instructor not found"), { status: 200 });

    const { status } = await req.json();   // "online" | "offline" | "busy"

    if (!["online", "offline", "busy"].includes(status))
      return NextResponse.json(buildResponse(false, "Invalid duty status"), { status: 200 });

    // ===== Eligibility Checks =====
    const isProfileCompleted = Boolean(
      instructor.fullName &&
      instructor.registrationNumber &&
      instructor.ownerName &&
      instructor.dlNumber &&
      instructor.dlImageFrontUrl &&
      instructor.dlImageBackUrl &&
      instructor.location
    );

    const isVehicleCompleted = Boolean(
      instructor.carType &&
      instructor.vehicleNumber &&
      instructor.rcBookUrl
    );

    // Cannot go ONLINE unless fully verified
    if (
      status === "online" &&
      (
        !isProfileCompleted ||
        !isVehicleCompleted ||
        instructor.status !== "approved"
      )
    ) {
      return NextResponse.json(
        buildResponse(false, "Profile or vehicle not verified. You cannot go online.", {
          dutyStatus: "offline",
          isProfileCompleted,
          isVehicleCompleted,
          reviewStatus: instructor.status
        }),
        { status: 200 }
      );
    }

    // ===== Save Duty Status =====
    instructor.dutyStatus = status;
    instructor.lastActiveAt = new Date();
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Duty status updated", {
        dutyStatus: instructor.dutyStatus,
        lastActiveAt: instructor.lastActiveAt
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("duty update error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
