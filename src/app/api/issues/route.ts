import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Issue from "@/models/Issue";

const WHATSAPP_NUMBER = "918978553778"; // support number

// 📌 Unified 200 response helper
function apiResponse(
  success: boolean,
  message: string,
  data: Record<string, any> = {}
) {
  return NextResponse.json(
    {
      success,
      message,
      data,
    },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const {
      userId,
      bookingId,
      instructorId,
      issueType,
      message,
    } = await req.json();

    // ---------------- VALIDATION ----------------
    if (!userId || !issueType || !message) {
      return apiResponse(false, "Missing required fields");
    }

    // ---------------- SAVE ISSUE ----------------
    const issue = await Issue.create({
      userId,
      bookingId: bookingId || "",
      instructorId: instructorId || "",
      issueType,
      message,
      status: "pending",
    });

    // ---------------- WHATSAPP MESSAGE ----------------
    const text = encodeURIComponent(
      `🚨 New DrivKaro Issue Report\n\n` +
        `👤 User ID: ${userId}\n` +
        (bookingId ? `📘 Booking ID: ${bookingId}\n` : "") +
        (instructorId ? `🧑‍🏫 Instructor ID: ${instructorId}\n` : "") +
        `🐞 Issue Type: ${issueType}\n\n` +
        `📝 Message:\n${message}\n`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    return apiResponse(true, "Issue submitted successfully", {
      issueId: issue._id?.toString() || "",
      userId: issue.userId || "",
      bookingId: issue.bookingId || "",
      instructorId: issue.instructorId || "",
      issueType: issue.issueType || "",
      message: issue.message || "",
      status: issue.status || "pending",
      createdAt: issue.createdAt || "",
      whatsappUrl: whatsappUrl || "",
    });

  } catch (error) {
    console.error("Issue submit error:", error);
    return apiResponse(false, "Server error");
  }
}
