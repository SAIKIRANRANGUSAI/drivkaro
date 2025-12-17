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
      bookingId = "",
      serviceType = "",
      message = "",
    } = body;

    // -------- VALIDATION --------
    if (!serviceType || !message) {
      return apiResponse(false, "Service type and message are required", {});
    }

    // -------- SAVE ISSUE --------
    const issue = await Issue.create({
      bookingId,
      serviceType,
      message,
      status: "pending",
    });

    // -------- WHATSAPP MESSAGE --------
    const text = encodeURIComponent(
      `🚨 New Issue Report\n\n` +
        (bookingId ? `📘 Booking ID: ${bookingId}\n` : "") +
        `🛠 Service Type: ${serviceType}\n\n` +
        `📝 Message:\n${message}`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    // -------- RESPONSE --------
    return apiResponse(true, "Issue submitted successfully", {
      issueId: issue._id?.toString() || "",
      bookingId: issue.bookingId || "",
      serviceType: issue.serviceType || "",
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
