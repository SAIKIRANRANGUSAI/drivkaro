import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";

// 👇 Force-load all models so Mongoose registers schemas properly
import "@/models/User";
import "@/models/Instructor";
import "@/models/DrivingLicenseRequest";

import LicenseRequest from "@/models/DrivingLicenseRequest";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // unwrap dynamic params
    const { id } = await context.params;
    const { status } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "License request ID missing" },
        { status: 400 }
      );
    }

    // All allowed statuses
    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "contacted",
      "accepted",
      "not_interested",
      "ongoing",
      "rejected",
    ];

    // Validate
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing status" },
        { status: 400 }
      );
    }

    // Update record
    const updated = await LicenseRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "License request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "License status updated successfully",
      data: updated,
    });
  } catch (err: any) {
    console.error("Admin update license error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
