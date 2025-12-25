import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Tip from "@/models/Tip";
import Booking from "@/models/Booking";
import { addToDriverWallet } from "@/utils/wallet";
import { verifyAccessToken } from "@/lib/jwt";

function apiResponse(success: boolean, message: string, data: any = {}) {
  return NextResponse.json({ success, message, data }, { status: 200 });
}

function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromToken(req);
    if (!userId) return apiResponse(false, "Unauthorized");

    const { amount, message = "" } = await req.json();
    if (!amount || amount <= 0)
      return apiResponse(false, "Valid tip amount is required");

    // 🔹 Find latest active booking
    const booking = await Booking.findOne({
      userId,
      assignedInstructorId: { $exists: true },
      status: { $in: ["ongoing", "completed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!booking) return apiResponse(false, "No booking found for tipping");

    const driverId = booking.assignedInstructorId;

    // 🔹 Prevent duplicate tipping for same booking (optional)
    const existingTip = await Tip.findOne({
      bookingId: booking.bookingId,
      userId,
    });

    if (existingTip) {
      return apiResponse(true, "Tip already added for this booking", {
        tipId: existingTip._id.toString(),
        amount: existingTip.amount,
        message: existingTip.message,
      });
    }

    // 💾 Save tip (💡 status must match enum)
    const tip = await Tip.create({
      bookingId: booking.bookingId,
      userId,
      driverId,
      amount,
      message,
      status: "paid", // ← FIX HERE
    });

    // 💰 Credit instructor wallet
    await addToDriverWallet(driverId, amount);

    return apiResponse(true, "Tip added successfully", {
      tipId: tip._id.toString(),
      bookingId: tip.bookingId,
      driverId: tip.driverId,
      amount: tip.amount,
      message: tip.message,
      status: tip.status,
      createdAt: tip.createdAt,
    });
  } catch (err) {
    console.error("TIP API ERROR:", err);
    return apiResponse(false, "Server error");
  }
}
