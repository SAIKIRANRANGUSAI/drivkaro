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

    const booking = await Booking.findById(bookingId);

    if (!booking)
      return NextResponse.json(buildResponse(false, "Booking not found"), { status: 200 });

    if (booking.status !== "requested")
      return NextResponse.json(buildResponse(false, "Booking no longer available"), { status: 200 });

    booking.status = "rejected";
    booking.rejectedBy = instructorId;
    await booking.save();

    return NextResponse.json(
      buildResponse(true, "Booking rejected", { bookingId }),
      { status: 200 }
    );

  } catch (e) {
    console.error("reject booking error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
