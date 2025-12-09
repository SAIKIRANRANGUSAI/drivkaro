import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import cloudinary from "@/lib/cloudinary";

// ---------------- CLOUDINARY UPLOAD ----------------
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);

        // Save secure URL
        resolve(result?.secure_url || "");
      }
    );

    stream.end(buffer);
  });
}

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

    const formData = await req.formData();

    // ---------------- VALIDATION ----------------
    const required = [
      "fullName",
      "gender",
      "dob",
      "city",
      "vehicleNumber",
      "dlNumber",
      "idProofType",
    ];

    for (const key of required) {
      if (!formData.get(key)) {
        return NextResponse.json(
          { success: false, message: `${key} is required` },
          { status: 400 }
        );
      }
    }

    // ---------------- FILE UPLOADS ----------------
    let dlImageUrl = "";
    let idProofUrl = "";

    const dlFile = formData.get("dlImage") as File | null;
    const idFile = formData.get("idProof") as File | null;

    if (dlFile) {
      dlImageUrl = await uploadToCloudinary(dlFile, "instructors/dl");
    }

    if (idFile) {
      idProofUrl = await uploadToCloudinary(idFile, "instructors/idproof");
    }

    // ---------------- UPDATE DB ----------------
    const updated = await Instructor.findByIdAndUpdate(
      instructorId,
      {
        fullName: formData.get("fullName"),
        gender: formData.get("gender"),

        // FIX: Convert dd/mm/yyyy to correct format
        dob: new Date(formData.get("dob") as string),

        city: formData.get("city"),
        carTypes: (formData.get("carTypes") as string)?.split(",") || [],

        vehicleNumber: formData.get("vehicleNumber"),
        dlNumber: formData.get("dlNumber"),

        ...(dlImageUrl && { dlImageUrl }),
        idProofType: formData.get("idProofType"),
        ...(idProofUrl && { idProofUrl }),

        status: "pending",
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
      data: updated,
    });

  } catch (err) {
    console.error("Instructor profile update error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
