import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

//
// ================= GET BOOKING DETAILS =================
//
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({
        success: false,
        code: "BOOKING_ID_MISSING",
        message: "Booking ID missing",
        data: null,
      });
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        data: null,
      });
    }

    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json({
        success: false,
        code: "BOOKING_NOT_FOUND",
        message: "Booking not found",
        data: null,
      });
    }

    if (booking.userId.toString() !== userId) {
      return NextResponse.json({
        success: false,
        code: "FORBIDDEN",
        message: "Access denied",
        data: null,
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const todayDay = booking.days.find((d: any) => d.date === today);

    const otp = todayDay
      ? {
          dayNo: todayDay.dayNo,
          date: todayDay.date,
          startOtp: todayDay.startOtp,
          endOtp: todayDay.endOtp,
          status: todayDay.status,
        }
      : null;

    return NextResponse.json({
      success: true,
      code: "BOOKING_FETCHED",
      message: "Booking fetched successfully",
      data: {
        booking,
        todayOtp: otp,
      },
    });
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}

//
// ================= CANCEL BOOKING =================
//
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({
        success: false,
        code: "BOOKING_ID_MISSING",
        message: "Booking ID missing",
        data: null,
      });
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
        data: null,
      });
    }

    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json({
        success: false,
        code: "BOOKING_NOT_FOUND",
        message: "Booking not found",
        data: null,
      });
    }

    if (booking.userId.toString() !== userId) {
      return NextResponse.json({
        success: false,
        code: "FORBIDDEN",
        message: "Access denied",
        data: null,
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json({
      success: true,
      code: "BOOKING_CANCELLED",
      message: "Booking cancelled successfully",
      data: null,
    });
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: null,
    });
  }
}
