import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import Booking from "@/models/Booking";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = getInstructorId(req);
    const instructor: any = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );

    // ✅ Normalize values to avoid TS errors
    const dutyStatus = instructor.dutyStatus ?? "offline";
    const reviewStatus = instructor.status ?? "pending";

    // ✅ Allow BUSY + ONLINE (block if offline or not approved)
    if (!["online", "busy"].includes(dutyStatus) ||
        reviewStatus !== "approved") {
      return NextResponse.json(
        buildResponse(false, "Driver is not active", {
          dutyStatus
        }),
        { status: 200 }
      );
    }

    if (!instructor.location?.coordinates)
      return NextResponse.json(
        buildResponse(false, "Location not set"),
        { status: 200 }
      );

    const [lng, lat] = instructor.location.coordinates;

    // 🟢 Show requested + unassigned ongoing bookings
    const bookings = await Booking.find({
      $or: [
        { status: "requested" },
        { status: "ongoing", assignedInstructorId: null }
      ],
      pickupLocationPoint: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 15000
        }
      }
    }).limit(20);

    return NextResponse.json(
      buildResponse(true, "Nearby bookings fetched", {
        count: bookings.length,
        bookings
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("nearby booking error", e);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
