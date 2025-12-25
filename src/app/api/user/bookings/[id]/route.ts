// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Booking from "@/models/Booking";

// //
// // GET BOOKING DETAILS
// //
// export async function GET(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     await connectDB();

//     const { id } = await context.params; // 👈 FIXED

//     if (!id) {
//       return NextResponse.json(
//         { success: false, message: "Booking ID missing", data: null },
//         { status: 400 }
//       );
//     }

//     const userId = request.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: null },
//         { status: 401 }
//       );
//     }

//     let booking = null;

//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       booking = await Booking.findById(id);
//     }

//     if (!booking) {
//       booking = await Booking.findOne({ bookingId: id });
//     }

//     if (!booking) {
//       return NextResponse.json(
//         { success: false, message: "Booking not found", data: null },
//         { status: 404 }
//       );
//     }

//     if (booking.userId.toString() !== userId) {
//       return NextResponse.json(
//         { success: false, message: "Forbidden", data: null },
//         { status: 403 }
//       );
//     }

//     const today = new Date().toISOString().split("T")[0];

//     const todayDay = booking.days.find((d: any) => d.date === today);

//     const otp = todayDay
//       ? {
//           dayNo: todayDay.dayNo,
//           date: todayDay.date,
//           startOtp: todayDay.startOtp,
//           endOtp: todayDay.endOtp,
//           status: todayDay.status,
//         }
//       : null;

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Booking fetched successfully",
//         data: { booking, todayOtp: otp },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("GET BOOKING ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: null },
//       { status: 500 }
//     );
//   }
// }

// //
// // CANCEL BOOKING
// //
// export async function DELETE(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     await connectDB();

//     const { id } = await context.params; // 👈 FIXED

//     if (!id) {
//       return NextResponse.json(
//         { success: false, message: "Booking ID missing", data: null },
//         { status: 400 }
//       );
//     }

//     const userId = request.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: null },
//         { status: 401 }
//       );
//     }

//     let booking = null;

//     if (/^[0-9a-fA-F]{24}$/.test(id)) {
//       booking = await Booking.findById(id);
//     }

//     if (!booking) {
//       booking = await Booking.findOne({ bookingId: id });
//     }

//     if (!booking) {
//       return NextResponse.json(
//         { success: false, message: "Booking not found", data: null },
//         { status: 404 }
//       );
//     }

//     if (booking.userId.toString() !== userId) {
//       return NextResponse.json(
//         { success: false, message: "Forbidden", data: null },
//         { status: 403 }
//       );
//     }

//     booking.status = "cancelled";
//     await booking.save();

//     return NextResponse.json(
//       { success: true, message: "Booking cancelled successfully", data: null },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("DELETE BOOKING ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: null },
//       { status: 500 }
//     );
//   }
// }

// E:\backup-projects\drivkaro\src\app\api\user\bookings\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import { verifyAccessToken } from "@/lib/jwt";
import { sendPushNotification } from "@/lib/sendNotification";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getUserIdFromToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const token = auth.split(" ")[1];
    const decoded: any = verifyAccessToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
}

// Helper to apply missed days logic
async function applyMissedDaysLogic(bookingId: string) {
  const booking: any = await Booking.findById(bookingId);
  if (!booking) return;

  const today = new Date().toISOString().split("T")[0];
  let changed = false;

  // Mark past pending days as missed
  booking.days.forEach((d: any) => {
    if (d.date < today && (d.status === "pending" || d.status === "started")) {
      d.status = "missed";
      changed = true;
    }
  });

  // Add extra days for missed ones
  const missedCount = booking.days.filter((d: any) => d.status === "missed").length;
  if (missedCount > 0 && changed) {
    let nextDate = new Date(booking.days[booking.days.length - 1].date);
    nextDate.setDate(nextDate.getDate() + 1);
    for (let i = 0; i < missedCount; i++) {
      booking.days.push({
        dayNo: booking.days.length + 1,
        date: nextDate.toISOString().split("T")[0],
        slot: booking.slotTime,
        status: "pending",
        startOtp: null,
        endOtp: null,
        instructorId: null
      });
      nextDate.setDate(nextDate.getDate() + 1);
    }
    booking.daysCount = booking.days.length; // Update count
    await booking.save();
  }

  // Update booking status
  const allDone = booking.days.every(
    (d: any) => d.status === "completed" || d.status === "missed"
  );
  booking.status = allDone ? "completed" : "ongoing";
  await booking.save();
}

/* --------------------------------------------------
   GET BOOKING VIEW (Single Booking Screen)
-------------------------------------------------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: null,
      }, { status: 401 });

    let booking: any =
      /^[0-9a-fA-F]{24}$/.test(id)
        ? await Booking.findById(id)
        : await Booking.findOne({ bookingId: id });

    if (!booking)
      return NextResponse.json({
        success: false,
        message: "Booking not found",
        data: null,
      }, { status: 404 });

    if (booking.userId.toString() !== userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: null,
      }, { status: 403 });

    // Apply missed logic
    await applyMissedDaysLogic(booking._id);
    // Re-fetch
    booking = await Booking.findById(booking._id);

    const today = new Date().toISOString().split("T")[0];
    const todayDay = booking.days.find((d: any) => d.date === today);

    /* ---------- AUTO GENERATE OTP FOR TODAY ---------- */
    if (todayDay && (!todayDay.startOtp || !todayDay.endOtp)) {
      const startOtp = generateOtp();
      const endOtp = generateOtp();
      await Booking.updateOne(
        { _id: booking._id, "days.date": today },
        {
          $set: {
            "days.$.startOtp": startOtp,
            "days.$.endOtp": endOtp,
          },
        }
      );
      // Update in memory
      const updatedDay = booking.days.find((d: any) => d.date === today);
      if (updatedDay) {
        updatedDay.startOtp = startOtp;
        updatedDay.endOtp = endOtp;
      }
    }

    /* ---------- TOP-LEVEL INSTRUCTOR BLOCK ---------- */
    const firstAssigned = booking.days.find((d: any) => d.instructorId);
    const instructor = firstAssigned
      ? {
          id: firstAssigned.instructorId,
          name: firstAssigned.instructorName || null,
          phone: firstAssigned.instructorPhone || null,
          vehicleNumber: firstAssigned.instructorVehicleNumber || null,
          image: firstAssigned.instructorImage || null,
          assigned: true,
        }
      : { assigned: false, message: "Instructor will be assigned soon" };

    /* ---------- CLEAN DAYS LIST (NO INSTRUCTOR FIELDS) ---------- */
    const days = booking.days.map((d: any) => ({
      dayNo: d.dayNo,
      date: d.date,
      slot: d.slot,
      status: d.status,
      startOtp: d.startOtp,
      endOtp: d.endOtp,
    }));

    /* ---------- FINAL UI RESPONSE ---------- */
    return NextResponse.json({
      success: true,
      message: "Booking fetched successfully",
      data: {
        booking: {
          bookingId: booking.bookingId,
          bookingDate: booking.createdAt,
          pickupLocation: booking.pickupLocation?.name || null, // Same as drop
          carType: booking.carType,
          startDate: booking.days[0]?.date || null,
          endDate: booking.days[booking.days.length - 1]?.date || null,
          totalDays: booking.days.length, // Updated
          slotTime: booking.slotTime,
          instructor,
          days,
        },
        todayOtp: todayDay
          ? {
              dayNo: todayDay.dayNo,
              date: todayDay.date,
              startOtp: todayDay.startOtp,
              endOtp: todayDay.endOtp,
              status: todayDay.status,
            }
          : null,
      },
    });
  } catch (err) {
    console.error("BOOKING VIEW ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
      data: null,
    }, { status: 500 });
  }
}

/* --------------------------------------------------
   CANCEL BOOKING
-------------------------------------------------- */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await ctx.params;
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: null,
      }, { status: 401 });

    let booking: any =
      /^[0-9a-fA-F]{24}$/.test(id)
        ? await Booking.findById(id)
        : await Booking.findOne({ bookingId: id });

    if (!booking)
      return NextResponse.json({
        success: false,
        message: "Booking not found",
        data: null,
      }, { status: 404 });

    if (booking.userId.toString() !== userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: null,
      }, { status: 403 });

    booking.status = "cancelled";
    await booking.save();

    // Send notification
    await sendPushNotification(userId, "Booking Cancelled", `Your booking ${booking.bookingId} has been cancelled.`);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      data: null,
    });
  } catch (err) {
    console.error("BOOKING CANCEL ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
      data: null,
    }, { status: 500 });
  }
}