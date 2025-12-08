import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Instructor from "@/models/Instructor";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        { success: false, message: "x-instructor-id header required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Update instructor
    const updated = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        fullName: body.fullName,
        gender: body.gender,
        dob: body.dob,
        city: body.city,
        carTypes: body.carTypes,
        vehicleNumber: body.vehicleNumber,
        dlNumber: body.dlNumber,
        dlImageUrl: body.dlImageUrl,
        idProofType: body.idProofType,
        idProofUrl: body.idProofUrl,
        status: "pending", // submit for approval
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Instructor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile submitted for approval",
      instructor: updated,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
