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
      { status: 200 }
    );
  }
}

/* ============================
   CREATE BANNER
============================ */
export async function POST(req: Request) {
  try {
    // ✅ 1. Ensure DB connection (this is enough)
    await connectDB();

    // ✅ 2. Parse request body safely
    const body = await req.json();
    console.log("📥 Incoming banner payload:", body);

    const index = Number(body.index);
    const image = body.image?.trim();
    const link = body.link?.trim() || "";
    const active = body.active ?? true;

    // ✅ 3. Strong validation
    if (Number.isNaN(index) || !image) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid index and image are required",
          data: {},
        },
        { status: 200 }
      );
    }

    // ✅ 4. Create banner
    const banner = await Banner.create({
      index,
      image,
      link,
      active,
    });

    console.log("✅ Banner stored in DB with ID:", banner._id.toString());

    // ✅ 5. Success response
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ POST /api/admin/banners ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create banner",
        data: {},
      },
      { status: 200 }
    );
  }
}

