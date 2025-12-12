import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import LogoSetting from "@/models/LogoSetting";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await dbConnect();

  const form = await req.formData();
  const file = form.get("file") as File;

  if (!file) return NextResponse.json({ success: false });

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded: any = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "drivkaro/logo" },
      (err, result) => (err ? reject(err) : resolve(result))
    ).end(buffer);
  });

  let settings = await LogoSetting.findOne();
  if (!settings) settings = await LogoSetting.create({ logoUrl: uploaded.secure_url });

  settings.logoUrl = uploaded.secure_url;
  await settings.save();

  return NextResponse.json({ success: true, url: uploaded.secure_url });
}
