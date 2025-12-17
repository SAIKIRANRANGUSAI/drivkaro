import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Issue from "@/models/Issue";

export async function GET() {
  try {
    await connectDB();

    const issues = await Issue.find()
      .sort({ createdAt: -1 })
      .lean();

    const data = issues.map((issue: any) => ({
      issueId: issue._id?.toString() || "",
      bookingId: issue.bookingId || "",
      serviceType: issue.serviceType || "",
      message: issue.message || "",
      createdAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : "",
    }));

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin issues fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: [],
      },
      { status: 500 }
    );
  }
}