import { NextRequest, NextResponse } from "next/server";
import CMSPage from "@/models/CMSPage";
import connectDB from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ page: string }> }
) {
  try {
    await connectDB();

    // 🔥 FIX: unwrap params
    const { page } = await context.params;

    const allowed = ["about", "privacy", "terms"];
    if (!allowed.includes(page)) {
      return NextResponse.json(
        { success: false, message: "Invalid page" },
        { status: 400 }
      );
    }

    const data = await CMSPage.findOne({ page });

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      page: data,
    });

  } catch (err) {
    console.error("CMS GET error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
