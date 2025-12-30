import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import cloudinary from "@/lib/cloudinary";
import { getInstructorId } from "@/lib/auth";

function buildResponse(success: boolean, message: string, data: any = {}) {
  return { success, message, data };
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

/* ========== POST — SAVE / UPDATE VEHICLE DETAILS ========== */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const instructorId = getInstructorId(req);

    const form = await req.formData();
    const instructor = await Instructor.findById(instructorId);

    if (!instructor)
      return NextResponse.json(buildResponse(false, "Instructor not found"), { status: 200 });

    instructor.carType = form.get("carType") as string;
    instructor.fuelType = form.get("fuelType") as string;
    instructor.brand = form.get("brand") as string;

    // 🔹 FIX — use set() to avoid conflict with mongoose .model()
    instructor.set("model", form.get("model") as string);

    instructor.purchaseYear = form.get("purchaseYear") as string;
    instructor.vehicleNumber = form.get("vehicleNumber") as string;

    const rcFile = form.get("rcBook") as File | null;
    if (rcFile)
      instructor.rcBookUrl = await upload(rcFile, "instructors/vehicle/rc");

    const images: string[] = [];
    const files = form.getAll("carImages") as File[];
    for (const f of files) {
      images.push(await upload(f, "instructors/vehicle/images"));
    }
    if (images.length) instructor.carImages = images;

    await instructor.save();

    const isVehicleCompleted = Boolean(
      instructor.carType &&
      instructor.vehicleNumber &&
      instructor.rcBookUrl
    );

    return NextResponse.json(
      buildResponse(true, "Vehicle details updated", {
        isVehicleCompleted
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("vehicle update error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}

/* ========== GET — FETCH VEHICLE DETAILS ========== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const instructorId = getInstructorId(req);

    const instructor = await Instructor.findById(instructorId);
    if (!instructor)
      return NextResponse.json(buildResponse(false, "Instructor not found"), { status: 200 });

    const isVehicleCompleted = Boolean(
      instructor.carType &&
      instructor.vehicleNumber &&
      instructor.rcBookUrl
    );

    return NextResponse.json(
      buildResponse(true, "Vehicle details fetched", {
        carType: instructor.carType,
        fuelType: instructor.fuelType,
        brand: instructor.brand,
        model: instructor.model,
        purchaseYear: instructor.purchaseYear,
        vehicleNumber: instructor.vehicleNumber,
        rcBook: instructor.rcBookUrl || "",
        carImages: instructor.carImages || [],
        isVehicleCompleted
      }),
      { status: 200 }
    );

  } catch (e) {
    console.error("vehicle fetch error", e);
    return NextResponse.json(buildResponse(false, "Server error"), { status: 200 });
  }
}
