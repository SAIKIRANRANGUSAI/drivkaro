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

    const body = await req.json();

    const {
      userName = "",
      bookingId = "",
      instructorName = "",
      issueType = "",
      message = "",
    } = body;

    // ---------------- VALIDATION ----------------
    if (!userName || !issueType || !message) {
      return apiResponse(false, "Required fields missing", {});
    }

    // ---------------- SAVE ISSUE ----------------
    const issue = await Issue.create({
      userName,
      bookingId,
      instructorName,
      issueType,
      message,
      status: "pending",
    });

    // ---------------- WHATSAPP MESSAGE ----------------
    const text = encodeURIComponent(
      `🚨 New DrivKaro Issue Report\n\n` +
        `👤 User: ${userName}\n` +
        (bookingId ? `📘 Booking ID: ${bookingId}\n` : "") +
        (instructorName ? `🧑‍🏫 Instructor: ${instructorName}\n` : "") +
        `🐞 Issue Type: ${issueType}\n\n` +
        `📝 Message:\n${message}\n`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    // ---------------- RESPONSE ----------------
    return apiResponse(true, "Issue submitted successfully", {
      issueId: issue._id?.toString() || "",
      userName: issue.userName || "",
      bookingId: issue.bookingId || "",
      instructorName: issue.instructorName || "",
      issueType: issue.issueType || "",
      message: issue.message || "",
      status: issue.status || "pending",
      createdAt: issue.createdAt || "",
      whatsappUrl,
    });
  } catch (error) {
    console.error("Issue submit error:", error);
    return apiResponse(false, "Server error", {});
  }
}
