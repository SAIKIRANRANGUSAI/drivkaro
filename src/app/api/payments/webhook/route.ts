import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

// Utility: convert null/undefined to empty values
function sanitize(obj: any) {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    cleaned[key] =
      obj[key] === null || obj[key] === undefined ? "" : obj[key];
  });
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { bookingId } = await req.json();

    // ❌ Validation (still return proper error codes)
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "bookingId is required", data: {} },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found", data: {} },
        { status: 404 }
      );
    }

    // ✅ Update booking
    booking.paymentStatus = "success";
    booking.paid = true;
    booking.status = "ongoing";
    booking.paymentTxnRef = "manual-complete";

    await booking.save();

    // ✅ Clean response data (null → "")
    const responseData = sanitize(booking.toObject());

    // ✅ SUCCESS → ALWAYS 200 (app friendly)
    return NextResponse.json(
      {
        success: true,
        message: "Payment success & booking set to ongoing",
        data: responseData,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error("Payment Update Error:", err);

    // ❌ Server error
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
