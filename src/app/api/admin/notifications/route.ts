import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Notification from "@/models/Notification";  // optional if storing
import { sendPushNotification } from "@/lib/sendNotification";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Required fields missing" },
        { status: 400 }
      );
    }

    // OPTIONAL: Save in DB
    // await Notification.create({ title, message });

    // Send to all users/instructors
    await sendPushNotification({
      title,
      message,
      topic: "all", // we can target specific users later
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("NOTIFICATION ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
