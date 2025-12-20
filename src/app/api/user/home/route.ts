import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Banner from "@/models/Banner";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          data: {},
        },
        { status: 200 }
      );
    }

    const user = await User.findById(userId).lean();

    const today = new Date().toISOString().split("T")[0];

    // ================= MY SCHEDULE =================
    const myBooking = await Booking.findOne({
      userId,
      status: { $in: ["pending", "ongoing"] },
      "days.date": today,
    }).lean();

    const myToday = myBooking
      ? {
          bookingId: myBooking.bookingId,
          dayNo: myBooking.days.find((d: any) => d.date === today)?.dayNo || 0,
          totalDays: myBooking.daysCount,
          scheduleEnd: myBooking.days.at(-1)?.date || "",
        }
      : {
          bookingId: "",
          dayNo: 0,
          totalDays: 0,
          scheduleEnd: "",
        };

    // ================= OTHER SCHEDULE =================
    const otherBooking = await Booking.findOne({
      bookedFor: "other",
      userId,
      status: { $in: ["pending", "ongoing"] },
      "days.date": today,
    }).lean();

    const otherToday = otherBooking
      ? {
          bookingId: otherBooking.bookingId,
          dayNo: otherBooking.days.find((d: any) => d.date === today)?.dayNo || 0,
          totalDays: otherBooking.daysCount,
          scheduleEnd: otherBooking.days.at(-1)?.date || "",
        }
      : {
          bookingId: "",
          dayNo: 0,
          totalDays: 0,
          scheduleEnd: "",
        };

    // ================= BANNERS =================
    const banners = await Banner.find({ active: true })
      .sort({ index: 1 })
      .select("index image link")
      .lean();

    // ================= COUNTS =================
    const totalBookings = await Booking.countDocuments({ userId });
    const ongoing = await Booking.countDocuments({
      userId,
      status: "ongoing",
    });
    const completed = await Booking.countDocuments({
      userId,
      status: "completed",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Home data fetched",
        data: {
          user: {
            name: user?.name || "",
            walletAmount: user?.wallet || 0,
          },
          banners: banners || [],
          todayMySchedule: myToday,
          todayOtherSchedule: otherToday,
          stats: {
            totalBookings,
            ongoing,
            completed,
          },
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("HOME API ERROR:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        data: {},
      },
      { status: 200 }
    );
  }
}
