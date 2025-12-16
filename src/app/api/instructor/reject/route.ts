import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

// 🔹 utility: standard response
function buildResponse(
  success: boolean,
  message: string,
  data: any = {}
) {
  return { success, message, data };
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { id, message } = await req.json();

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!id) {
      return NextResponse.json(
        buildResponse(false, "Instructor id is required"),
        { status: 400 }
      );
    }

    // -----------------------------
    // UPDATE INSTRUCTOR
    // -----------------------------
    const instructor = await Instructor.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionMessage: message || "",
      },
      { new: true }
    );

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 404 }
      );
    }

    // -----------------------------
    // RESPONSE (APP FRIENDLY)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "Instructor rejected successfully", {
        id: instructor._id.toString(),
        status: instructor.status,
        rejectionMessage: instructor.rejectionMessage || "",
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Reject instructor error:", err);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 500 }
    );
  }
}
