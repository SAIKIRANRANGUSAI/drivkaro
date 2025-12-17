import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import LogoSetting from "@/models/LogoSetting";
import FlashScreen from "@/models/FlashScreen";

export async function GET() {
  try {
    await connectDB();

    // 1️⃣ Get logo (single document)
    const logoDoc = await LogoSetting.findOne({}).lean();

    // 2️⃣ Get flash screens (multiple documents)
    const flashDocs = await FlashScreen.find({}).sort({ createdAt: 1 }).lean();

    return NextResponse.json(
      {
        success: true,

        // always string
        logo: logoDoc?.logoUrl ?? "",

        // always array
        flashScreens: Array.isArray(flashDocs)
          ? flashDocs.map((fs: any) => ({
              id: fs._id?.toString() ?? "",
              image: fs.image ?? "",
              heading: fs.heading ?? "",
              description: fs.description ?? "",
            }))
          : [],
      },
      { status: 200 }
    );
  } catch (error) {
    // ⚠️ NEVER BREAK APP
    return NextResponse.json(
      {
        success: true,
        logo: "",
        flashScreens: [],
      },
      { status: 200 }
    );
  }
}
