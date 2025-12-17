import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Issue from "@/models/Issue";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await connectDB();

    const deleted = await Issue.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Issue not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Issue deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin issue delete error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Delete failed",
      },
      { status: 500 }
    );
  }
}