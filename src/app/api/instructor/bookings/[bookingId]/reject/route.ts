import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Instructor from "@/models/Instructor";

// 🔹 utility: standard response (ALWAYS 200)
function buildResponse(
  success: boolean,
  message: string,
  data: any = {}
) {
  return { success, message, data };
}

// 🔹 sanitize null / undefined → ""
function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj || {}).forEach((key) => {
    clean[key] =
      obj[key] === null || obj[key] === undefined ? "" : obj[key];
  });
  return clean;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    await connectDB();

    // ✅ unwrap params (Next.js 16 safe)
    const { bookingId } = await context.params;

    if (!bookingId) {
      return NextResponse.json(
        buildResponse(false, "bookingId missing in URL"),
        { status: 200 }
      );
    }

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        buildResponse(false, "x-instructor-id header required"),
        { status: 200 }
      );
    }

    // -----------------------------
    // OPTIONAL BODY (REASON)
    // -----------------------------
    let reason = "Not available";
    try {
      const body = await req.json();
      reason = body?.reason || reason;
    } catch {
      /* body optional */
    }

    // -----------------------------
    // INSTRUCTOR CHECK
    // -----------------------------
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );
    }

    if (instructor.status !== "approved") {
      return NextResponse.json(
        buildResponse(false, "Instructor not approved by admin"),
        { status: 200 }
      );
    }

    // -----------------------------
    // FIND BOOKING
    // -----------------------------
    let booking: any = null;

    if (/^[0-9a-fA-F]{24}$/.test(bookingId)) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      booking = await Booking.findOne({ bookingId });
    }

    if (!booking) {
      return NextResponse.json(
        buildResponse(false, "Booking not found"),
        { status: 200 }
      );
    }

    // -----------------------------
    // BUSINESS RULES
    // -----------------------------
    if (!booking.paid) {
      return NextResponse.json(
        buildResponse(
          false,
          "Payment not completed. Cannot reject booking."
        ),
        { status: 200 }
      );
    }

    if (["cancelled", "completed"].includes(booking.status)) {
      return NextResponse.json(
        buildResponse(false, `Booking already ${booking.status}`),
        { status: 200 }
      );
    }

    if (!booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(
          false,
          "No instructor was assigned earlier. Cannot reject."
        ),
        { status: 200 }
      );
    }

    if (booking.assignedInstructorId.toString() !== instructorId) {
      return NextResponse.json(
        buildResponse(
          false,
          "You are not the assigned instructor for this booking"
        ),
        { status: 200 }
      );
    }

    // -----------------------------
    // UNASSIGN & REVERT BOOKING
    // -----------------------------
    booking.assignedInstructorId = null;
    booking.assignedGender = "";
    booking.status = "pending";
    booking.instructorRejectedAt = new Date();
    booking.instructorRejectReason = reason;

    await booking.save();

    // -----------------------------
    // RESPONSE (ALWAYS 200)
    // -----------------------------
    return NextResponse.json(
      buildResponse(
        true,
        "Booking rejected successfully",
        sanitize({
          bookingId: booking.bookingId || booking._id.toString(),
          status: booking.status,
          reason,
        })
      ),
      { status: 200 }
    );

  } catch (err) {
    console.error("Instructor reject booking error:", err);

    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
