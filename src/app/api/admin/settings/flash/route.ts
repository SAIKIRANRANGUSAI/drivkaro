import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import FlashScreen from "@/models/FlashScreen";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const form = await req.formData();
    const total = Number(form.get("total"));

    let screens: any[] = [];

    for (let i = 0; i < total; i++) {
      const heading = form.get(`heading_${i}`) as string;
      const description = form.get(`description_${i}`) as string;
      const existing = form.get(`existingImage_${i}`) as string;
      const file = form.get(`image_${i}`) as unknown as File;

      let imageUrl = existing;

      if (file && (file as any).size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());

        const upload: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "drivkaro/flash" },
            (err, result) => (err ? reject(err) : resolve(result))
          ).end(buffer);
        });

        imageUrl = upload.secure_url;
      }

      screens.push({
        image: imageUrl,
        heading,
        description,
      });
    }

    await FlashScreen.deleteMany();
    await FlashScreen.insertMany(screens);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("FLASH SAVE ERROR:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
