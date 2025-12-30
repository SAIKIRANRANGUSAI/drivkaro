import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import Booking from "@/models/Booking";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = getInstructorId(req);
    const { bookingId } = await req.json();

    const instructor = await Instructor.findById(instructorId);
    const booking = await Booking.findById(bookingId);

    if (!instructor || !booking)
      return NextResponse.json(buildResponse(false, "Invalid booking or instructor"), { status: 200 });

    if (booking.instructor?.toString() !== instructorId)
      return NextResponse.json(buildResponse(false, "Booking not assigned to this driver"), { status: 200 });

    if (booking.status !== "started")
      return NextResponse.json(buildResponse(false, "Trip not in progress"), { status: 200 });

    // ===== Complete Trip =====
    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    instructor.dutyStatus = "online"; // driver free again
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Trip completed successfully", {
        bookingId: booking._id,
        dutyStatus: instructor.dutyStatus
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("trip end error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
