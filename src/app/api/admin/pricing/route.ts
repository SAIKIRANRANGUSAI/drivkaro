import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Pricing from "@/models/Pricing";

/* =========================
   GET ALL PRICING
========================= */
export async function GET() {
  try {
    await connectDB();
    const list = await Pricing.find().sort({ carType: 1 }).lean();

    return NextResponse.json(
      { success: true, data: list ?? [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /pricing error:", error);
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500 }
    );
  }
}

/* =========================
   CREATE / UPDATE PRICING
========================= */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { carType, pricePerDay, gstPercent, image } = body;

    if (!carType || !pricePerDay || !image) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🔁 UPSERT (update if exists, else create)
    const pricing = await Pricing.findOneAndUpdate(
      { carType },
      {
        carType,
        pricePerDay: Number(pricePerDay),
        gstPercent: Number(gstPercent ?? 18),
        image,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(
      { success: true, data: pricing },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /pricing error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
