import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = getInstructorId(req);
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );
    }

    // ===== Profile completion check =====
    const isProfileCompleted = Boolean(
      instructor.fullName &&
      instructor.registrationNumber &&
      instructor.ownerName &&
      instructor.dlNumber &&
      instructor.dlImageFrontUrl &&
      instructor.dlImageBackUrl &&
      instructor.location
    );

    // ===== Vehicle completion check =====
    const isVehicleCompleted = Boolean(
      instructor.carType &&
      instructor.vehicleNumber &&
      instructor.rcBookUrl
    );

    // ===== Auto-restrict duty when not eligible =====
    let dutyStatus = instructor.dutyStatus || "offline";

    if (!isProfileCompleted || !isVehicleCompleted || instructor.status !== "approved") {
      // Force offline if driver shouldn't be active
      if (dutyStatus !== "offline") {
        instructor.dutyStatus = "offline";
        await instructor.save();
      }
      dutyStatus = "offline";
    }

    return NextResponse.json(
      buildResponse(true, "Home data loaded", {
        greeting: "Good Morning",
        driverName: instructor.fullName || "",

        // booking placeholders (will integrate later)
        todaysBookings: null,
        activeBookings: null,
        completedBookings: null,

        // menu mapping for UI
        menu: {
          todays: "Today's Bookings",
          active: "Active Bookings",
          completed: "Completed Bookings",
          profile: "My Profile",
          transaction: "Transaction",
          logout: "Logout"
        },

        // status flags
        isProfileCompleted,
        isVehicleCompleted,
        showVehicleBanner: !isVehicleCompleted,

        // review flow
        reviewStatus: instructor.status,
        rejectionMessage: instructor.rejectionMessage || "",

        // ===== Duty / Availability (NEW) =====
        dutyStatus,                  // online | offline | busy
        lastActiveAt: instructor.lastActiveAt || null
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("home api error", e);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
