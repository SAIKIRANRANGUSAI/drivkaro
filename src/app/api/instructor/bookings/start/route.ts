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
    if (!instructor)
      return NextResponse.json(buildResponse(false, "Instructor not found"), { status: 200 });

    /* ---------- Fetch booking by _id or bookingId ---------- */
    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking)
      return NextResponse.json(buildResponse(false, "Booking not found"), { status: 200 });


    /* ---------- Check if booking has instructor assigned ---------- */
    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(false, "No instructor has accepted this booking yet"),
        { status: 200 }
      );
    }

    /* ---------- Check if booking belongs to this instructor ---------- */
    if (booking.assignedInstructorId.toString() !== instructorId) {
      return NextResponse.json(
        buildResponse(false, "Booking assigned to another instructor"),
        { status: 200 }
      );
    }


    /* ---------- Get today's session day ---------- */
    const today = new Date().toISOString().split("T")[0];

    const todayDay = booking.days.find(
      (d: any) => d.date === today
    );

    if (!todayDay) {
      return NextResponse.json(
        buildResponse(false, "No session scheduled for today"),
        { status: 200 }
      );
    }

    /* ---------- Validate day status ---------- */
    if (!["pending", "started"].includes(todayDay.status)) {
      return NextResponse.json(
        buildResponse(false, "Session cannot be started for this day"),
        { status: 200 }
      );
    }

    /* ---------- Validate OTP ---------- */
    if (todayDay.startOtp !== otp) {
      return NextResponse.json(
        buildResponse(false, "Invalid OTP"),
        { status: 200 }
      );
    }

    /* ---------- Start Day Session ---------- */
    todayDay.status = "started";
    todayDay.startedAt = new Date();

    booking.status = "ongoing"; // booking level state
    await booking.save();

    instructor.dutyStatus = "busy";
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Session started successfully", {
        bookingId: booking.bookingId,
        dayNo: todayDay.dayNo,
        date: todayDay.date,
        dutyStatus: instructor.dutyStatus
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("session start error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
