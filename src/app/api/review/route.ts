import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      bookingId = "",
      userId = "",
      driverId = "",
      rating,
      message = "",
    } = body;

    // 🔍 Validation
    if (!userId || !driverId || !rating) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields missing",
          data: null,
        },
        { status: 200 }
      );
    }

    // 💾 Save review
    const review = await Review.create({
      bookingId,
      userId,
      driverId,
      rating,
      message,
      status: "success",
    });

    // ✅ Success response
    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully",
        data: review,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Review API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: null,
      },
      { status: 200 }
    );
  }
}
