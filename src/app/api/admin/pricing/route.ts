import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Pricing from "@/models/Pricing";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  if (!Array.isArray(body)) {
    return NextResponse.json({ message: "Send array of pricing items" }, { status: 400 });
  }

  await Pricing.deleteMany(); // Reset all pricing
  const inserted = await Pricing.insertMany(body);

  return NextResponse.json({ success: true, inserted });
}

export async function GET() {
  await connectDB();
  const list = await Pricing.find().sort({ carType: 1, days: 1 });

  return NextResponse.json({ success: true, pricing: list });
}
