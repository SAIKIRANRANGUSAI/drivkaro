import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Instructor from "@/models/Instructor";

// 🔹 utility: standard response
function buildResponse(
  success: boolean,
  message: string,
  data: any = {}
) {
  return { success, message, data };
}

// 🔹 sanitize null → ""
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

    // ✅ FIX: unwrap params correctly (Next.js 16)
    const { bookingId } = await context.params;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!bookingId) {
      return NextResponse.json(
        buildResponse(false, "bookingId missing in URL"),
        { status: 400 }
      );
    }

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        buildResponse(false, "x-instructor-id header is required"),
        { status: 400 }
      );
    }

    // -----------------------------
    // INSTRUCTOR CHECK
    // -----------------------------
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 404 }
      );
    }

    if (instructor.status !== "approved") {
      return NextResponse.json(
        buildResponse(false, "Instructor not approved by admin"),
        { status: 403 }
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
        { status: 404 }
      );
    }

    // -----------------------------
    // BOOKING RULES
    // -----------------------------
    if (!booking.paid) {
      return NextResponse.json(
        buildResponse(false, "Payment not completed"),
        { status: 400 }
      );
    }

    if (["cancelled", "completed"].includes(booking.status)) {
      return NextResponse.json(
        buildResponse(false, `Booking already ${booking.status}`),
        { status: 400 }
      );
    }

    if (booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(false, "Instructor already assigned"),
        { status: 409 }
      );
    }

    // -----------------------------
    // ASSIGN INSTRUCTOR
    // -----------------------------
    booking.assignedInstructorId = instructor._id;
    booking.assignedGender = instructor.gender;
    booking.status = "ongoing";
    booking.instructorAcceptedAt = new Date();

    booking.days = (booking.days || []).map((day: any) => ({
      ...day,
      instructorId: instructor._id,
      instructorName: instructor.fullName || "",
      instructorPhone: instructor.mobile || "",
    }));

    await booking.save();

    // -----------------------------
    // RESPONSE
    // -----------------------------
    return NextResponse.json(
      buildResponse(
        true,
        "Booking accepted successfully",
        sanitize({
          bookingId: booking.bookingId || booking._id.toString(),
          status: booking.status,
          instructor: {
            id: instructor._id.toString(),
            name: instructor.fullName || "",
            mobile: instructor.mobile || "",
          },
        })
      ),
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Instructor accept booking error:", err);
    return NextResponse.json(
      buildResponse(false, err.message || "Internal Server Error"),
      { status: 500 }
    );
  }
}
