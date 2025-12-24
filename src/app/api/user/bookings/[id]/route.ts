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



import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ------------------------------------
// GET BOOKING (Booking View Screen)
// ------------------------------------
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id)
      return NextResponse.json(
        { success: false, message: "Booking ID missing", data: null },
        { status: 400 }
      );

    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );

    // Find by ObjectId or bookingId
    let booking: any = /^[0-9a-fA-F]{24}$/.test(id)
      ? await Booking.findById(id)
      : await Booking.findOne({ bookingId: id });

    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found", data: null },
        { status: 404 }
      );

    if (booking.userId.toString() !== userId)
      return NextResponse.json(
        { success: false, message: "Forbidden", data: null },
        { status: 403 }
      );

    const today = new Date().toISOString().split("T")[0];

    // -----------------------------
    // AUTO-GENERATE OTP FOR TODAY
    // -----------------------------
    const todayDay = booking.days.find((d: any) => d.date === today);

    if (todayDay) {
      if (!todayDay.startOtp) todayDay.startOtp = generateOtp();
      if (!todayDay.endOtp) todayDay.endOtp = generateOtp();

      await Booking.updateOne(
        { _id: booking._id, "days.date": today },
        {
          $set: {
            "days.$.startOtp": todayDay.startOtp,
            "days.$.endOtp": todayDay.endOtp,
          },
        }
      );
    }

    // -----------------------------
    // AUTO ADD EXTRA DAY IF SKIPPED
    // -----------------------------
    const skippedCount = booking.days.filter(
      (d: any) => d.status === "skipped"
    ).length;

    const extraDaysRequired =
      booking.daysCount + skippedCount - booking.days.length;

    if (extraDaysRequired > 0) {
      for (let i = 0; i < extraDaysRequired; i++) {
        booking.days.push({
          dayNo: booking.days.length + 1,
          date: null,
          status: "pending",
          startOtp: null,
          endOtp: null,
        });
      }

      await booking.save();
    }

    // -----------------------------
    // DERIVED BOOKING STATUS
    // -----------------------------
    const allDone = booking.days.every(
      (d: any) => d.status === "completed" || d.status === "skipped"
    );

    const stillOngoing = booking.days.some(
      (d: any) => d.status === "pending" || d.status === "skipped"
    );

    booking.status = allDone ? "completed" : stillOngoing ? "ongoing" : "pending";
    await booking.save();

    return NextResponse.json(
      {
        success: true,
        message: "Booking fetched successfully",
        data: {
          booking,
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
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET BOOKING ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}

// ------------------------------------
// CANCEL BOOKING
// ------------------------------------
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!id)
      return NextResponse.json(
        { success: false, message: "Booking ID missing", data: null },
        { status: 400 }
      );

    const userId = request.headers.get("x-user-id");
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: null },
        { status: 401 }
      );

    let booking: any = /^[0-9a-fA-F]{24}$/.test(id)
      ? await Booking.findById(id)
      : await Booking.findOne({ bookingId: id });

    if (!booking)
      return NextResponse.json(
        { success: false, message: "Booking not found", data: null },
        { status: 404 }
      );

    if (booking.userId.toString() !== userId)
      return NextResponse.json(
        { success: false, message: "Forbidden", data: null },
        { status: 403 }
      );

    booking.status = "cancelled";
    await booking.save();

    return NextResponse.json(
      {
        success: true,
        message: "Booking cancelled successfully",
        data: null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: null },
      { status: 500 }
    );
  }
}
