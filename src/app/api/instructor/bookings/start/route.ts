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
    const { bookingId, otp } = await req.json();

    const instructor = await Instructor.findById(instructorId);
    const booking = await Booking.findById(bookingId);

    if (!instructor || !booking)
      return NextResponse.json(buildResponse(false, "Invalid booking or instructor"), { status: 200 });

    if (booking.instructor?.toString() !== instructorId)
      return NextResponse.json(buildResponse(false, "Booking not assigned to this driver"), { status: 200 });

    if (booking.status !== "accepted")
      return NextResponse.json(buildResponse(false, "Trip cannot be started"), { status: 200 });

    if (booking.startOtp !== otp)
      return NextResponse.json(buildResponse(false, "Invalid OTP"), { status: 200 });

    // ===== Start trip =====
    booking.status = "started";
    booking.startedAt = new Date();
    await booking.save();

    instructor.dutyStatus = "busy";
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Trip started successfully", {
        bookingId: booking._id,
        dutyStatus: instructor.dutyStatus
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("trip start error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
