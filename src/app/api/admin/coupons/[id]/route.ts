import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Coupon from "@/models/Coupon";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ FIX – MUST AWAIT PARAMS

    console.log("DELETE API HIT for:", id);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Coupon ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await Coupon.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Coupon deleted permanently" },
      { status: 200 }
    );

  } catch (err) {
    console.error("DELETE COUPON ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
