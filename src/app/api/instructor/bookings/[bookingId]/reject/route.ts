import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Instructor from "@/models/Instructor";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectDB();

    // unwrap params
    const { bookingId } = await context.params;

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header required" },
        { status: 400 }
      );
    }

    // optional body
    let reason = "Not available";
    try {
      const body = await req.json();
      reason = body?.reason || "Not available";
    } catch (_) {
      // no JSON body provided
    }

    // verify instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { success: false, message: "Invalid instructor" },
        { status: 401 }
      );
    }

    // find booking
    const booking = await Booking.findById(
      new mongoose.Types.ObjectId(bookingId)
    );
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // update booking
    booking.assignedInstructorId = null;
    booking.status = "pending";
    booking.instructorRejectedAt = new Date();
    booking.instructorRejectReason = reason;

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking rejected",
    });
  } catch (err) {
    console.error("Instructor reject error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
