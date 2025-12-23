import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import LearningConfig from "@/models/LearningConfig";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { perDayKmLimit, totalLearningKm, selectableDays } = body;

    const config = await LearningConfig.findOneAndUpdate(
      {},
      {
        perDayKmLimit,
        totalLearningKm,
        selectableDays,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Learning configuration updated",
      data: config,
    });
  } catch (e) {
    return NextResponse.json({
      success: false,
      message: "Update failed",
    });
  }
}
