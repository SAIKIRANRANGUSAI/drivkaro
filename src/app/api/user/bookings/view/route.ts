// E:\backup-projects\drivkaro\src\app\api\user\bookings\view\route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import { verifyAccessToken } from "@/lib/jwt";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getUserId(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

/* ======================================================
   MISSED DAY + EXTENSION LOGIC
====================================================== */
async function applyMissedDaysLogic(bookingId: string) {
  const booking: any = await Booking.findById(bookingId);
  if (!booking) return;

  const today = new Date().toISOString().split("T")[0];
  let changed = false;

  // Mark past pending days as MISSED only if OTP not used
  booking.days.forEach((d: any) => {
    if (
      d.date < today &&
      d.status === "pending" &&
      !d.startOtp &&
      !d.endOtp
    ) {
      d.status = "missed";
      changed = true;
    }
  });

  // Count missed and add extra days (MAX 10)
  const missedCount = booking.days.filter((d: any) => d.status === "missed").length;
  const extraNeeded = Math.min(missedCount, 10);

  if (extraNeeded > 0 && changed) {
    let nextDate = new Date(booking.days[booking.days.length - 1].date);
    nextDate.setDate(nextDate.getDate() + 1);

    for (let i = 0; i < extraNeeded; i++) {
      booking.days.push({
        dayNo: booking.days.length + 1,
        date: nextDate.toISOString().split("T")[0],
        slot: booking.slotTime,
        status: "pending",
        startOtp: null,
        endOtp: null,
        instructorId: booking.assignedInstructorId || null
      });

      nextDate.setDate(nextDate.getDate() + 1);
    }

    booking.daysCount = booking.days.length;
    await booking.save();
  }

  // Auto-update booking status
  const allDone = booking.days.every(
    (d: any) => d.status === "completed" || d.status === "missed"
  );

  booking.status = allDone ? "completed" : "ongoing";
  await booking.save();
}

/* ======================================================
   GET BOOKING VIEW
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserId(req);

    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );

    // Fetch latest non-cancelled booking
    let booking: any = await Booking.findOne({
      userId,
      status: { $ne: "cancelled" }
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!booking)
      return NextResponse.json({
        success: false,
        message: "No active booking found",
        data: null
      }, { status: 404 });

    // Apply missed-day logic
    await applyMissedDaysLogic(booking._id);
    booking = await Booking.findById(booking._id).lean();

    const today = new Date().toISOString().split("T")[0];
    const todayDay = booking.days.find((d: any) => d.date === today);

    /* ======================================================
       OTP — ONLY FOR TODAY + PENDING + NO EXISTING OTP
    ======================================================= */
    if (
      todayDay &&
      todayDay.status === "pending" &&
      (!todayDay.startOtp || !todayDay.endOtp)
    ) {
      const startOtp = generateOtp();
      const endOtp = generateOtp();

      await Booking.updateOne(
        { _id: booking._id, "days.date": today },
        {
          $set: {
            "days.$.startOtp": startOtp,
            "days.$.endOtp": endOtp
          }
        }
      );

      todayDay.startOtp = startOtp;
      todayDay.endOtp = endOtp;
    }

    /* ======================================================
       INSTRUCTOR (BOOKING-LEVEL)
    ======================================================= */
    const instructor = booking.assignedInstructorId
  ? {
      id: booking.assignedInstructorId,
      name: booking.instructorName,
      phone: booking.instructorPhone,
      vehicleNumber: booking.instructorVehicleNumber,
      image: booking.instructorImage,
      assigned: true
    }
  : {
      assigned: false,
      id: null,
      name: null,
      phone: null,
      vehicleNumber: null,
      image: null
    };


    /* ======================================================
       DAYS LIST — CLEAN RESPONSE
    ======================================================= */
    const days = booking.days.map((d: any) => ({
      dayNo: d.dayNo,
      date: d.date,
      slot: d.slot,
      status: d.status,
      startOtp: d.startOtp,
      endOtp: d.endOtp
    }));

    return NextResponse.json({
      success: true,
      message: "Booking view loaded",
      data: {
        header: {
          bookingId: booking.bookingId,
          bookingDate: booking.createdAt,
          pickupLocation: booking.pickupLocation?.name || null,
          carType: booking.carType,
          bookingDates: {
            startDate: booking.days[0]?.date || null,
            endDate: booking.days[booking.days.length - 1]?.date || null
          },
          totalDays: booking.days.length,
          slotTime: booking.slotTime
        },
        instructor,
        todayOtp: todayDay
          ? {
              dayNo: todayDay.dayNo,
              date: todayDay.date,
              startOtp: todayDay.startOtp,
              endOtp: todayDay.endOtp,
              status: todayDay.status
            }
          : null,
        days
      }
    });

  } catch (err) {
    console.error("BOOKING VIEW ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}
