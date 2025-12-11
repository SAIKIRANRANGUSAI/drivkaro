import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Instructor from "@/models/Instructor";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectDB();

    // 1️⃣ Unwrap params
    const { bookingId } = await context.params;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId missing in URL" },
        { status: 400 }
      );
    }

    // 2️⃣ Get Instructor ID
    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header is required" },
        { status: 400 }
      );
    }

    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return NextResponse.json(
        { success: false, message: "Instructor not found" },
        { status: 404 }
      );
    }

    if (instructor.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Instructor not approved by admin" },
        { status: 403 }
      );
    }

    // 3️⃣ Get booking
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

    // 4️⃣ Rules
    if (!booking.paid) {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

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

    if (booking.assignedInstructorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Instructor already assigned",
        },
        { status: 400 }
      );
    }

    // 5️⃣ Assign instructor
    booking.assignedInstructorId = instructor._id;
    booking.assignedGender = instructor.gender;
    booking.status = "ongoing";
    booking.instructorAcceptedAt = new Date();

    // 6️⃣ Fix: Add type for day
    booking.days = booking.days.map((day: any) => ({
      ...day,
      instructorId: instructor._id,
      instructorName: instructor.fullName,
      instructorPhone: instructor.mobile,
    }));

    // 7️⃣ Save
    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking accepted successfully",
      data: booking,
    });
  } catch (err: any) {
    console.error("Instructor accept booking error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
