import { NextRequest, NextResponse } from "next/server";
import Tip from "@/models/Tip";
import { addToDriverWallet } from "@/utils/wallet";
import dbConnect from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { bookingId, userId, driverId, amount, message } = await req.json();

  const tip = await Tip.create({
    bookingId,
    userId,
    driverId,
    amount,
    message,
  });

  await addToDriverWallet(driverId, amount);

  return NextResponse.json({ success: true, tip });
}
