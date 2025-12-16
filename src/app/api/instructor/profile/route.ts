import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import cloudinary from "@/lib/cloudinary";

// ---------------- UTILS ----------------
function buildResponse(
  success: boolean,
  message: string,
  data: any = {}
) {
  return { success, message, data };
}

// Convert null / undefined → ""
function sanitize(obj: any) {
  const clean: any = {};
  Object.keys(obj || {}).forEach((key) => {
    clean[key] =
      obj[key] === null || obj[key] === undefined ? "" : obj[key];
  });
  return clean;
}

// ---------------- CLOUDINARY UPLOAD ----------------
async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );
    stream.end(buffer);
  });
}

// ================= POST: SUBMIT / UPDATE PROFILE =================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        buildResponse(false, "x-instructor-id header required"),
        { status: 400 }
      );
    }

    const formData = await req.formData();

    // ---------------- VALIDATION ----------------
    const requiredFields = [
      "fullName",
      "gender",
      "dob",
      "city",
      "vehicleNumber",
      "dlNumber",
      "idProofType",
    ];

    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json(
          buildResponse(false, `${field} is required`),
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
        dob: new Date(formData.get("dob") as string),
        city: formData.get("city"),
        carTypes:
          (formData.get("carTypes") as string)?.split(",") || [],
        vehicleNumber: formData.get("vehicleNumber"),
        dlNumber: formData.get("dlNumber"),
        idProofType: formData.get("idProofType"),
        ...(dlImageUrl && { dlImageUrl }),
        ...(idProofUrl && { idProofUrl }),
        status: "pending",
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 404 }
      );
    }

    // ---------------- RESPONSE ----------------
    return NextResponse.json(
      buildResponse(true, "Profile submitted for approval", sanitize({
        id: updated._id.toString(),
        fullName: updated.fullName,
        gender: updated.gender,
        dob: updated.dob,
        city: updated.city,
        carTypes: updated.carTypes,
        vehicleNumber: updated.vehicleNumber,
        dlNumber: updated.dlNumber,
        dlImageUrl: updated.dlImageUrl,
        idProofType: updated.idProofType,
        idProofUrl: updated.idProofUrl,
        status: updated.status,
      })),
      { status: 200 }
    );

  } catch (err) {
    console.error("Instructor profile update error:", err);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 500 }
    );
  }
}

// ================= GET: FETCH PROFILE =================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const instructorId = req.headers.get("x-instructor-id");

    if (!instructorId) {
      return NextResponse.json(
        buildResponse(false, "x-instructor-id header required"),
        { status: 400 }
      );
    }

    const instructor = await Instructor.findById(instructorId).select(
      "-password -__v"
    );

    if (!instructor) {
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      buildResponse(true, "Profile fetched successfully", sanitize({
        id: instructor._id.toString(),
        fullName: instructor.fullName,
        gender: instructor.gender,
        dob: instructor.dob,
        city: instructor.city,
        carTypes: instructor.carTypes,
        vehicleNumber: instructor.vehicleNumber,
        dlNumber: instructor.dlNumber,
        dlImageUrl: instructor.dlImageUrl,
        idProofType: instructor.idProofType,
        idProofUrl: instructor.idProofUrl,
        status: instructor.status,
      })),
      { status: 200 }
    );

  } catch (err) {
    console.error("Get instructor profile error:", err);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 500 }
    );
  }
}
