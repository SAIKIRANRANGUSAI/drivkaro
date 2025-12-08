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

    // Unwrap params (Fix for Next.js App Router)
    const { bookingId } = await context.params;

    // Instructor ID from headers
    const instructorId = req.headers.get("x-instructor-id");
    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header is required" },
        { status: 400 }
      );
    }

    // Validate instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { success: false, message: "Invalid instructor" },
        { status: 401 }
      );
    }

    // Must be admin approved
    if (instructor.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Instructor not approved by admin" },
        { status: 403 }
      );
    }

    // Lookup booking (ObjectId fix)
    const booking = await Booking.findById(
      new mongoose.Types.ObjectId(bookingId)
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Cannot accept cancelled booking
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "Booking already cancelled" },
        { status: 400 }
      );
    }

    // Assign instructor using correct schema field
    booking.assignedInstructorId = instructor._id;
    booking.status = "ongoing";
    booking.instructorAcceptedAt = new Date(); // extra tracking

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking accepted",
      booking,
    });

  } catch (err) {
    console.error("Instructor accept booking error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
