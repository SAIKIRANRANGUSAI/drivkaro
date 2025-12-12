import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import LogoSetting from "@/models/LogoSetting";
import FlashScreen from "@/models/FlashScreen";
import AdminLog from "@/models/AdminLog";

export async function GET() {
  await dbConnect();

  const logo = await LogoSetting.findOne();
  const flashScreens = await FlashScreen.find().sort({ createdAt: 1 });
  const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(200);

  return NextResponse.json({
    logo: logo?.logoUrl || "",
    flashScreens,
    logs,
  });
}
