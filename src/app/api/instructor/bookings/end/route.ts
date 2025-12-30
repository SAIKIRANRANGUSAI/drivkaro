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

    /* ---------- Instructor Assignment Checks ---------- */
    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(false, "No instructor has accepted this booking yet"),
        { status: 200 }
      );
    }

    if (booking.assignedInstructorId.toString() !== instructorId) {
      return NextResponse.json(
        buildResponse(false, "Booking assigned to another instructor"),
        { status: 200 }
      );
    }

    /* ---------- Get today's day session ---------- */
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

    /* ---------- Validate session state ---------- */
    if (todayDay.status !== "started") {
      return NextResponse.json(
        buildResponse(false, "Session is not in progress"),
        { status: 200 }
      );
    }

    /* ---------- Validate Drop OTP ---------- */
    if (todayDay.endOtp !== otp) {
      return NextResponse.json(
        buildResponse(false, "Invalid OTP"),
        { status: 200 }
      );
    }

    /* ---------- Complete Day Session ---------- */
    todayDay.status = "completed";
    todayDay.completedAt = new Date();

    /* ---------- Check if all days are completed ---------- */
    const allDone = booking.days.every(
      (d: any) => d.status === "completed" || d.status === "missed"
    );

    if (allDone) {
      booking.status = "completed";
    } else {
      booking.status = "ongoing";
    }

    await booking.save();

    instructor.dutyStatus = "online";
    await instructor.save();

    return NextResponse.json(
      buildResponse(true, "Session completed successfully", {
        bookingId: booking.bookingId,
        dayNo: todayDay.dayNo,
        date: todayDay.date,
        bookingStatus: booking.status,
        dutyStatus: instructor.dutyStatus
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("session end error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
