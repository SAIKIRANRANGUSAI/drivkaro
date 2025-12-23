import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Banner from "@/models/Banner";

/* ============================
   GET ALL BANNERS
============================ */
export async function GET() {
  try {
    // ✅ Always await DB first
    await connectDB();
    const banners = await Banner.find({})
      .sort({ index: 1 })
      .lean();
    return NextResponse.json(
      {
        success: true,
        message: "Banners fetched successfully",
        data: banners ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/banners ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch banners",
        data: [],
      },
      { status: 500 }  // Changed to 500 for server errors
    );
  }
}

/* ============================
   CREATE BANNER
============================ */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    console.log("📥 Incoming banner payload:", body);  // Keep for debugging

    const index = Number(body.index);
    const image = body.image?.trim();
    const link = body.link?.trim() || "";
    const active = body.active ?? true;

    // Strong validation
    if (Number.isNaN(index) || index < 0 || !image || !image.startsWith('http')) {  // Basic URL check
      console.log("❌ Validation failed: index=", index, "image=", !!image);  // Debug log
      return NextResponse.json(
        {
          success: false,
          message: "Valid index (number >= 0) and image URL are required",
          data: {},
        },
        { status: 400 }  // Client error
      );
    }

    const banner = await Banner.create({
      index,
      image,
      link,
      active,
    });
    console.log("✅ Banner stored in DB with ID:", banner._id.toString());

    return NextResponse.json(
      {
        success: true,
        message: "Banner created successfully",
        data: {
          id: banner._id,
          index: banner.index,
          image: banner.image,
          link: banner.link,
          active: banner.active,
          createdAt: banner.createdAt,
        },
      },
      { status: 201 }  // Created
    );
  } catch (error: any) {
    console.error("❌ POST /api/admin/banners ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create banner",
        data: {},
      },
      { status: 500 }  // Server error
    );
  }
}