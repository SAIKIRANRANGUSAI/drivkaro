import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

// 🔹 utility: standard response (ALWAYS 200)
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

    const body = await req.json().catch(() => ({}));
    const id = body?.id || "";
    const message = body?.message || "";

    // -----------------------------
    // VALIDATION (APP FRIENDLY)
    // -----------------------------
    if (!id) {
      return NextResponse.json(
        buildResponse(false, "Instructor id is required"),
        { status: 200 }
      );
    }

    // -----------------------------
    // UPDATE INSTRUCTOR
    // -----------------------------
    const instructor = await Instructor.findByIdAndUpdate(
      id,
      {
        status: "rejected",
        rejectionMessage: message,
      },
      { new: true }
    );

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );
    }

    // -----------------------------
    // RESPONSE (NO NULLS, ALWAYS 200)
    // -----------------------------
    return NextResponse.json(
      buildResponse(true, "Instructor rejected successfully", {
        id: instructor._id.toString(),
        status: instructor.status || "",
        rejectionMessage: instructor.rejectionMessage || "",
      }),
      { status: 200 }
    );

  } catch (err) {
    console.error("Reject instructor error:", err);

    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
