import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

//
// GET BOOKING
//
export async function GET(req: Request, context: any) {
  try {
    await connectDB();

    const { id } = (await context?.params) || {};

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID missing", data: null },
        { status: 400 }
      );
    }

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    let booking = null;

    // Try MongoDB _id
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }

    // Try bookingId (BK******)
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: null },
        { status: 404 }
      );
    }

    // Ownership check
    if (booking.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking fetched",
        data: { booking },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}

//
// CANCEL BOOKING
//
export async function DELETE(req: Request, context: any) {
  try {
    await connectDB();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID missing", data: null },
        { status: 400 }
      );
    }

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    let booking = null;

    // Try MongoDB _id
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }

    // Try bookingId
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: null },
        { status: 404 }
      );
    }

    // Ownership check
    if (booking.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    // Cancel booking
    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json(
      {
        success: true,
        message: "Booking cancelled successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}
