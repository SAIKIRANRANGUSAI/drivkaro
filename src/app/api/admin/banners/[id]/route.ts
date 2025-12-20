import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Banner from "@/models/Banner";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const deleted = await Banner.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Banner deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/banners/[id] error:", error);

    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}
