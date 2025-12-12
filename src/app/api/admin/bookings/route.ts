import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";

// 🔥 IMPORTANT: Register models BEFORE querying
import "@/models/Instructor";
import "@/models/User";
import Booking from "@/models/Booking";

export async function GET() {
  await connectDB();

  const bookings = await Booking.find()
    .populate("userId", "fullName mobile") // Get user info
    .populate("assignedInstructorId", "fullName mobile") // Get instructor info
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, bookings });
}
