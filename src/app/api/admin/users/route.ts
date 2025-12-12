import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import OtherUser from "@/models/OtherUser";
import Booking from "@/models/Booking";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();

  const users = await User.find().sort({ createdAt: -1 });

  const data = await Promise.all(
    users.map(async (u: any) => {
      const latest = await Booking.findOne({ userId: u._id }).sort({ createdAt: -1 });

      return {
        ...u._doc,
        latestLocation: latest?.pickupLocation?.name || "-",
      };
    })
  );

  return NextResponse.json({ users: data });
}
