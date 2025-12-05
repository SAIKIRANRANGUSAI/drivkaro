import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";     // ⭐ FIXED
import Booking from "@/models/Booking";
import User from "@/models/User";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const booking = await Booking.findById(id).populate("otherUserId");
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (booking.userId.toString() !== userId)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();

    const { id } = await context.params;

    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (booking.userId.toString() !== userId)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Booking cancelled",
      booking,
    });
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
