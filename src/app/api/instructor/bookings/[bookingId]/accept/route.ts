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
        buildResponse(false, "x-instructor-id header is required"),
        { status: 200 }
      );
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
        buildResponse(false, "Payment not completed"),
        { status: 200 }
      );
    }

    if (["cancelled", "completed"].includes(booking.status)) {
      return NextResponse.json(
        buildResponse(false, `Booking already ${booking.status}`),
        { status: 200 }
      );
    }

    if (booking.assignedInstructorId) {
      return NextResponse.json(
        buildResponse(false, "Instructor already assigned"),
        { status: 200 }
      );
    }

    // -----------------------------
    // ASSIGN INSTRUCTOR
    // -----------------------------
    booking.assignedInstructorId = instructor._id;
    booking.assignedGender = instructor.gender || "";
    booking.status = "ongoing";
    booking.instructorAcceptedAt = new Date();

    booking.days = (booking.days || []).map((day: any) => ({
      ...day,
      instructorId: instructor._id,
      instructorName: instructor.fullName || "",
      instructorImage: instructor.idProofUrl || "",
      instructorPhone: instructor.mobile || "",
      instructorVehicleNumber: instructor.vehicleNumber || "",
    }));

    await booking.save();

    // -----------------------------
    // RESPONSE (ALWAYS 200)
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
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
