import { NextRequest, NextResponse } from "next/server";
import Tip from "@/models/Tip";
import { addToDriverWallet } from "@/utils/wallet";
import dbConnect from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      bookingId = "",
      userId = "",
      driverId = "",
      amount,
      message = "",
    } = body;

    // 🔍 Basic validation
    if (!userId || !driverId || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Required fields missing",
          data: null,
        },
        { status: 200 }
      );
    }

    // 💾 Save tip
    const tip = await Tip.create({
      bookingId,
      userId,
      driverId,
      amount,
      message,
      status: "success", // added status
    });

    // 💰 Update driver wallet
    await addToDriverWallet(driverId, amount);

    // ✅ Success response
    return NextResponse.json(
      {
        success: true,
        message: "Tip added successfully",
        data: tip,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Tip API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        data: null,
      },
      { status: 200 }
    );
  }
}
