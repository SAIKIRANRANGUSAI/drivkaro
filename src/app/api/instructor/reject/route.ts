import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    const { id, message } = body;

    await Instructor.findByIdAndUpdate(id, {
      status: "rejected",
      rejectionMessage: message || "",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
