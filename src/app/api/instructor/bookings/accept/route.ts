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
    if (!instructor)
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );

    // ❌ BUSY cannot accept another booking
    if (instructor.dutyStatus === "busy") {
      return NextResponse.json(
        buildResponse(false, "Finish current booking first"),
        { status: 200 }
      );
    }

    // must be online
    if (instructor.dutyStatus !== "online")
      return NextResponse.json(
        buildResponse(false, "Driver not online"),
        { status: 200 }
      );

    // -----------------------------
    // FETCH BOOKING (id or BKxxxx)
    // -----------------------------
    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking)
      return NextResponse.json(
        buildResponse(false, "Booking not found"),
        { status: 200 }
      );

    // ❗ If already assigned → stop
    if (booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(false, "Booking already taken"),
        { status: 200 }
      );
    }

    // Allow only requested OR unassigned ongoing
    if (!["requested", "ongoing"].includes(booking.status)) {
      return NextResponse.json(
        buildResponse(false, "Booking not available"),
        { status: 200 }
      );
    }

    // 🛡 ATOMIC update — prevents race condition
    const updated = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        assignedInstructorId: null
      },
      {
        $set: {
          assignedInstructorId: instructorId,
          instructorName: instructor.fullName || instructor.ownerName || null,
          instructorPhone: instructor.mobile || null,
          instructorImage: instructor.profileImage || instructor.dlImageFrontUrl || null,
          instructorVehicleNumber: instructor.vehicleNumber || null,
          status: "accepted"
        }
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        buildResponse(false, "Booking already assigned"),
        { status: 200 }
      );
    }

    // 🚗 Set driver BUSY after accepting
    instructor.dutyStatus = "busy";
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Booking accepted", {
        bookingId: updated.bookingId,
        dutyStatus: "busy"
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("accept booking error", e);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
