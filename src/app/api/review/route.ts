import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { bookingId, userId, driverId, rating, message } = await req.json();

  const review = await Review.create({
    bookingId,
    userId,
    driverId,
    rating,
    message,
  });

  return NextResponse.json({ success: true, review });
}
