import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";

// register models
import "@/models/User";
import "@/models/Instructor";

import Booking from "@/models/Booking";

export async function GET() {
  await connectDB();

  const bookings = await Booking.find()
    .populate("userId", "fullName mobile") // CUSTOMER
    .populate("assignedInstructorId", "fullName mobile") // INSTRUCTOR
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, bookings });
}
