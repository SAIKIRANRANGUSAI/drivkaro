import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";  // Aligned with main route
import Banner from "@/models/Banner";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const deleted = await Banner.findByIdAndDelete(params.id);
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
    console.error("DELETE /banners error:", error);
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}