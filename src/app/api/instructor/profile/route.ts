import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import cloudinary from "@/lib/cloudinary";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
}

function sanitize(obj: any) {
  const out: any = {};
  Object.keys(obj || {}).forEach(k => {
    out[k] = obj[k] == null ? "" : obj[k];
  });
  return out;
}

async function upload(file: File, folder: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, res) => {
      if (err) return reject(err);
      resolve(res?.secure_url || "");
    }).end(buffer);
  });
}

/* =============== POST — SUBMIT / UPDATE PROFILE =============== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let instructorId: string | null = null;
    try {
      instructorId = getInstructorId(req);
    } catch {
      instructorId = null;
    }

    if (!instructorId)
      return NextResponse.json(
        buildResponse(false, "Unauthorized user"),
        { status: 200 }
      );

    const form = await req.formData();

    const required = [
      "drivingSchoolName",
      "registrationNumber",
      "ownerName",
      "email",
      "dlNumber"
    ];

    for (const f of required)
      if (!form.get(f))
        return NextResponse.json(
          buildResponse(false, `${f} is required`),
          { status: 200 }
        );

    const instructor = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );

    let dlFront = instructor.dlImageFrontUrl || "";
    let dlBack  = instructor.dlImageBackUrl || "";

    const frontFile = form.get("dlFront") as File | null;
    const backFile  = form.get("dlBack") as File | null;

    if (frontFile) dlFront = await upload(frontFile, "instructors/dl/front");
    if (backFile)  dlBack  = await upload(backFile,  "instructors/dl/back");

    instructor.fullName = form.get("drivingSchoolName") as string;
    instructor.registrationNumber = form.get("registrationNumber") as string;
    instructor.ownerName = form.get("ownerName") as string;
    instructor.email = form.get("email") as string;
    instructor.dlNumber = form.get("dlNumber") as string;
    instructor.dlImageFrontUrl = dlFront;
    instructor.dlImageBackUrl = dlBack;

    instructor.status = "pending";
    instructor.rejectionMessage = "";
    instructor.rejectedAt = null;

    await instructor.save();

    const profileCompleted = Boolean(
      instructor.fullName &&
      instructor.registrationNumber &&
      instructor.ownerName &&
      instructor.dlNumber &&
      instructor.dlImageFrontUrl &&
      instructor.dlImageBackUrl
    );

    return NextResponse.json(
      buildResponse(true, "Profile submitted for review", sanitize({
        id: instructor._id.toString(),
        drivingSchoolName: instructor.fullName,
        registrationNumber: instructor.registrationNumber,
        ownerName: instructor.ownerName,
        email: instructor.email,
        mobile: instructor.mobile,
        dlNumber: instructor.dlNumber,
        dlFront: instructor.dlImageFrontUrl,
        dlBack: instructor.dlImageBackUrl,
        status: instructor.status,
        profileCompleted
      })),
      { status: 200 }
    );

  } catch (e) {
    console.error("Profile update error", e);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}

/* =============== GET — FETCH PROFILE (ALWAYS 200) =============== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let instructorId: string | null = null;
    try {
      instructorId = getInstructorId(req);
    } catch {
      instructorId = null;
    }

    if (!instructorId)
      return NextResponse.json(
        buildResponse(false, "Unauthorized user"),
        { status: 200 }
      );

    const instructor = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(
        buildResponse(false, "Instructor not found"),
        { status: 200 }
      );

    const profileCompleted = Boolean(
      instructor.fullName &&
      instructor.registrationNumber &&
      instructor.ownerName &&
      instructor.dlNumber &&
      instructor.dlImageFrontUrl &&
      instructor.dlImageBackUrl
    );

    return NextResponse.json(
      buildResponse(true, "Profile fetched successfully", sanitize({
        id: instructor._id.toString(),
        drivingSchoolName: instructor.fullName,
        registrationNumber: instructor.registrationNumber,
        ownerName: instructor.ownerName,
        email: instructor.email,
        mobile: instructor.mobile,
        dlNumber: instructor.dlNumber,
        dlFront: instructor.dlImageFrontUrl,
        dlBack: instructor.dlImageBackUrl,
        status: instructor.status,
        rejectionMessage: instructor.rejectionMessage || "",
        profileCompleted
      })),
      { status: 200 }
    );

  } catch (e) {
    console.error("Get profile error", e);
    return NextResponse.json(
      buildResponse(false, "Server error"),
      { status: 200 }
    );
  }
}
