import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

export async function GET(
  req: Request,
  context: any
) {
  try {
    await connectDB();

    // ✔ SAFELY get params
    const { id } = await context?.params || {};

    if (!id) {
      return NextResponse.json(
        { message: "Booking ID missing" },
        { status: 400 }
      );
    }

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✔ Try MongoDB ObjectId
    let booking = null;

    if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }

    // ✔ If not found by _id, try bookingId like BK241223
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // ✔ Check ownership
    if (booking.userId.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, booking });

  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: any
) {
  try {
    await connectDB();

    // get :id from route
    const { id } = context?.params || {};

    if (!id) {
      return NextResponse.json(
        { message: "Booking ID missing" },
        { status: 400 }
      );
    }

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // find booking by _id OR bookingId
    let booking = null;

    if (typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: id });
    }

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // ownership check
    if (booking.userId.toString() !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // update status
    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json(
      { success: true, message: "Booking cancelled" },
      { status: 200 }
    );

  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
