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

    // 🔹 unwrap params correctly
    const { bookingId } = await context.params;

    // 🔹 Instructor ID from header
    const instructorId = req.headers.get("x-instructor-id");
    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header required" },
        { status: 400 }
      );
    }

    // 🔹 Optional body for reason
    let reason = "Not available";
    try {
      const body = await req.json();
      reason = body?.reason || "Not available";
    } catch (_) {
      /* ignore body parse */
    }

    // 🔹 Check instructor exists & approved
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return NextResponse.json(
        { success: false, message: "Invalid instructor" },
        { status: 401 }
      );
    }

    if (instructor.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Instructor not approved by admin" },
        { status: 403 }
      );
    }

    // 🔹 Find booking by ID or bookingId
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

    // 🔹 Must be paid before accept/reject
    if (!booking.paid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not completed. Cannot reject booking.",
        },
        { status: 400 }
      );
    }

    // 🔹 Cannot reject cancelled or completed
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "Booking already cancelled" },
        { status: 400 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Booking already completed" },
        { status: 400 }
      );
    }

    // 🔹 Must be assigned first
    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        {
          success: false,
          message: "No instructor was assigned earlier. Cannot reject.",
        },
        { status: 400 }
      );
    }

    // 🔹 Ensure correct instructor is rejecting
    if (booking.assignedInstructorId.toString() !== instructorId) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not the assigned instructor for this booking",
        },
        { status: 403 }
      );
    }

    // 🔹 Unassign instructor & revert booking
    booking.assignedInstructorId = null;
    booking.assignedGender = null;
    booking.status = "pending";

    booking.instructorRejectedAt = new Date();
    booking.instructorRejectReason = reason;

    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking rejected successfully",
      data: {
        bookingId: booking.bookingId,
        reason,
      },
    });
  } catch (err) {
    console.error("Instructor reject error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
