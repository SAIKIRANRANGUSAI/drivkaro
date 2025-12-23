import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import LearningConfig from "@/models/LearningConfig";

export async function GET() {
  try {
    await connectDB();

    let config = await LearningConfig.findOne();

    if (!config) {
      config = await LearningConfig.create({
        perDayKmLimit: 10,
        totalLearningKm: 40,
        selectableDays: [4, 8, 12],
      });
    }

    // ✅ IMPORTANT PART (YOU ASKED THIS)
    const totalLearningDays = Math.ceil(
      config.totalLearningKm / config.perDayKmLimit
    );

    return NextResponse.json({
      success: true,
      data: {
        perDayKmLimit: config.perDayKmLimit,
        totalLearningKm: config.totalLearningKm,
        totalLearningDays,
        learningRequirementText: `${config.totalLearningKm} km → ${totalLearningDays} days`,
        selectableDays: config.selectableDays,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      data: {},
    });
  }
}
