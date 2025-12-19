import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { verifyAccessToken } from "@/lib/jwt";
import { JwtPayload } from "jsonwebtoken";

interface TokenPayload extends JwtPayload {
  userId: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token) as TokenPayload;

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "Image file required",
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "drivkaro/users", resource_type: "image" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    await User.findByIdAndUpdate(decoded.userId, {
      profileImage: upload.secure_url,
    });

    return NextResponse.json({
      success: true,
      message: "Profile image uploaded",
      data: { image: upload.secure_url },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Upload failed" });
  }
}
