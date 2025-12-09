import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string; date: string }> }
) {
  try {
    const { bookingId, date } = await context.params;
    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return NextResponse.json(
        { success: false, message: "bookingId, date and otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // --------------------------
    // 1️⃣ Lookup booking
    // --------------------------
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

    // must be paid and ongoing
    if (!booking.paid || booking.status !== "ongoing") {
      return NextResponse.json(
        { success: false, message: "Booking not active" },
        { status: 400 }
      );
    }

    // --------------------------
    // 2️⃣ Get correct day
    // --------------------------
    const dayEntry = booking.days.find((d: any) => d.date === date);

    if (!dayEntry) {
      return NextResponse.json(
        { success: false, message: "No schedule found for this date" },
        { status: 404 }
      );
    }

    // must have start first
    if (!dayEntry.startOtp) {
      return NextResponse.json(
        { success: false, message: "Start session not done yet" },
        { status: 400 }
      );
    }

    // must NOT be completed already
    if (dayEntry.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Day already completed" },
        { status: 400 }
      );
    }

    // --------------------------
    // 3️⃣ Validate OTP
    // --------------------------

    if (dayEntry.endOtp !== otp) {
      return NextResponse.json(
        { success: false, message: "Invalid end OTP" },
        { status: 400 }
      );
    }

    // --------------------------
    // 4️⃣ Save BookingDay entry
    // --------------------------
    let bookingDay = await BookingDay.findOne({ booking: booking._id, date });

    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: booking._id, date });
    }

    bookingDay.endVerifiedAt = new Date();
    bookingDay.status = "completed";

    await bookingDay.save();

    // --------------------------
    // 5️⃣ Update embedded array
    // --------------------------
    dayEntry.status = "completed";
    dayEntry.endVerifiedAt = new Date();

    await booking.save();

    // --------------------------
    // 6️⃣ Auto complete booking if last day
    // --------------------------
    const allDone = booking.days.every((d: any) => d.status === "completed");

    if (allDone) {
      booking.status = "completed";
      booking.completedAt = new Date();
      await booking.save();
    }

    return NextResponse.json({
      success: true,
      message: "Day session completed",
      data: {
        date,
        status: dayEntry.status,
        bookingStatus: booking.status,
      },
    });

  } catch (err) {
    console.error("End day session error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
