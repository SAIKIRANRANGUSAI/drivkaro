import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

// 📌 Helper – get today (yyyy-mm-dd) in India timezone
function getTodayDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;
    const { otp } = await req.json();

    // 🔍 Basic validation
    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date & otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 🔍 Find booking by _id or bookingId
    let booking: any = null;

    // Try ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    // Else try bookingId (BK123456)
    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    // No booking?
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // 💰 Check payment status
    if (!booking.paid) {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // 👨‍🏫 Instructor check
    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        { success: false, message: "Instructor not assigned" },
        { status: 400 }
      );
    }

    // 📅 Find correct day entry
    const day = booking.days.find((d: any) => d.date === date);
    if (!day) {
      return NextResponse.json(
        { success: false, message: "No session scheduled for this date" },
        { status: 404 }
      );
    }

    // 🕒 Only allow today
    const today = getTodayDate();
    if (date !== today) {
      return NextResponse.json(
        {
          success: false,
          message: `Session allowed only for today. Today is ${today}`,
          allowedDate: today,
        },
        { status: 400 }
      );
    }

    // 🔐 OTP validation
    if (day.startOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 401 }
      );
    }

    // 🚫 Cannot start twice
    if (day.status === "started") {
      return NextResponse.json(
        { success: false, message: "Session already started" },
        { status: 400 }
      );
    }

    // 🚫 Cannot start if completed
    if (day.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Session already completed" },
        { status: 400 }
      );
    }

    // 🔥 START SESSION
    day.status = "started";
    day.startedAt = new Date();

    await booking.save();

    // ✅ SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: "Day session started",
      data: {
        bookingId: booking.bookingId,
        date: day.date,
        startedAt: day.startedAt,
      },
    });
  } catch (err) {
    console.error("START DAY ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
