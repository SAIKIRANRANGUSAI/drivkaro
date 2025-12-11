import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Issue from "@/models/Issue";

const WHATSAPP_NUMBER = "918978553778"; // your support number

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { userId, bookingId, instructorId, issueType, message } =
      await req.json();

    if (!userId || !issueType || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save issue in DB
    const issue = await Issue.create({
      userId,
      bookingId: bookingId || null,
      instructorId: instructorId || null,
      issueType,
      message,
      status: "pending",
    });

    // WhatsApp message
    const text = encodeURIComponent(
      `🚨 New DrivKaro Issue Report\n\n` +
      `👤 User ID: ${userId}\n` +
      (bookingId ? `📘 Booking ID: ${bookingId}\n` : "") +
      (instructorId ? `🧑‍🏫 Instructor ID: ${instructorId}\n` : "") +
      `🐞 Issue Type: ${issueType}\n\n` +
      `📝 Message:\n${message}\n`
    );

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    return NextResponse.json({
      success: true,
      message: "Issue submitted successfully",
      issue,
      whatsappUrl,
    });
  } catch (error) {
    console.error("Issue submit error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
