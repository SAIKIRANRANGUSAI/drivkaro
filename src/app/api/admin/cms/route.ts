import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CMSPage from "@/models/CMSPage";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { page, content } = await req.json();

    const allowed = ["about", "privacy", "terms"];
    if (!allowed.includes(page)) {
      return NextResponse.json(
        { success: false, message: "Invalid page type" },
        { status: 400 }
      );
    }

    const updated = await CMSPage.findOneAndUpdate(
      { page },
      { content },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${page} page updated`,
      page: updated
    });

  } catch (err) {
    console.error("CMS update error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
