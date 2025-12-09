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

    // 👉 Unwrap params
    const { bookingId } = await context.params;

    // 👉 Instructor ID from headers
    const instructorId = req.headers.get("x-instructor-id");
    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header is required" },
        { status: 400 }
      );
    }

    // 👉 Validate instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { success: false, message: "Invalid instructor" },
        { status: 401 }
      );
    }

    // 👉 Must be admin approved
    if (instructor.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Instructor not approved by admin" },
        { status: 403 }
      );
    }

    // 👉 Lookup booking (ObjectId fix)
    let booking = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // 👉 Booking must be paid before instructor accepts
    if (!booking.paid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not completed. Cannot assign instructor.",
        },
        { status: 400 }
      );
    }

    // 👉 Cannot accept cancelled booking
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "Booking already cancelled" },
        { status: 400 }
      );
    }

    // 👉 Cannot accept completed booking
    if (booking.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Booking already completed" },
        { status: 400 }
      );
    }

    // 👉 Prevent duplicate assignment
    if (booking.assignedInstructorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Instructor already assigned for this booking",
        },
        { status: 400 }
      );
    }

    // 👉 Assign instructor
    booking.assignedInstructorId = instructor._id;
    booking.assignedGender = instructor.gender;
    booking.status = "ongoing";
    booking.instructorAcceptedAt = new Date();

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking accepted successfully",
      data: booking,
    });
  } catch (err) {
    console.error("Instructor accept booking error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
