import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import { verifyAccessToken } from "@/lib/jwt";

function apiResponse(success: boolean, message: string, data: any = {}) {
  return NextResponse.json({ success, message, data }, { status: 200 });
}

// 🔹 Extract userId from token
function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;

  try {
    const decoded = verifyAccessToken(h.split(" ")[1]) as any;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromToken(req);
    if (!userId) return apiResponse(false, "Unauthorized — invalid token");

    const { rating, message = "" } = await req.json();

    if (!rating) {
      return apiResponse(false, "Rating is required");
    }

    // 🔹 Get latest completed / ongoing booking
    const booking = await Booking.findOne({
      userId,
      assignedInstructorId: { $exists: true },
      status: { $in: ["ongoing", "completed"] }
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!booking) {
      return apiResponse(false, "No booking found to review");
    }

    if (!booking.assignedInstructorId) {
      return apiResponse(false, "Instructor not assigned");
    }

    // 🔹 Prevent duplicate review
    const existing = await Review.findOne({
      bookingId: booking.bookingId,
      userId
    });

    if (existing) {
      return apiResponse(true, "Review already submitted", {
        reviewId: existing._id.toString(),
        rating: existing.rating,
        message: existing.message,
      });
    }

    // 🔹 Save Review
    const review = await Review.create({
      bookingId: booking.bookingId,
      userId,
      driverId: booking.assignedInstructorId,
      rating,
      message,
      status: "success",
    });

    return apiResponse(true, "Review submitted successfully", {
      reviewId: review._id.toString(),
      bookingId: review.bookingId,
      driverId: review.driverId,
      rating: review.rating,
      message: review.message,
      createdAt: review.createdAt
    });

  } catch (err) {
    console.error("REVIEW API ERROR:", err);
    return apiResponse(false, "Server error");
  }
}
