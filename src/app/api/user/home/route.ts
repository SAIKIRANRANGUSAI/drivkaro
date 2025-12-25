// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Booking from "@/models/Booking";
// import User from "@/models/User";
// import Banner from "@/models/Banner";
// import { verifyAccessToken } from "@/lib/jwt";

// function getUserIdFromToken(req: Request) {
//   const h = req.headers.get("authorization");
//   if (!h?.startsWith("Bearer ")) return null;
//   try {
//     return (verifyAccessToken(h.split(" ")[1]) as any).userId;
//   } catch {
//     return null;
//   }
// }

// function getGreeting() {
//   const hour = new Date().getHours();
//   if (hour < 12) return "Good Morning";
//   if (hour < 17) return "Good Afternoon";
//   return "Good Evening";
// }

// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();

//     const userId = getUserIdFromToken(req);
//     if (!userId) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Unauthorized",
//           data: {},
//         },
//         { status: 401 }
//       );
//     }

//     const user = await User.findById(userId).lean();
//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           message: "User not found",
//           data: {},
//         },
//         { status: 404 }
//       );
//     }

//     const today = new Date().toISOString().split("T")[0];

//     // ================= MY SCHEDULE =================
//     const myBooking = await Booking.findOne({
//       userId,
//       status: { $in: ["pending", "ongoing"] },
//       "days.date": today,
//     }).lean();

//     const myToday = myBooking
//       ? {
//           bookingId: myBooking.bookingId,
//           dayNo: myBooking.days.find((d: any) => d.date === today)?.dayNo || 0,
//           totalDays: myBooking.daysCount,
//           scheduleEnd: myBooking.days[myBooking.days.length - 1]?.date || "",
//           carType: myBooking.carType, // Added for UI car image
//           status: myBooking.days.find((d: any) => d.date === today)?.status || "pending",
//         }
//       : {
//           bookingId: "",
//           dayNo: 0,
//           totalDays: 0,
//           scheduleEnd: "",
//           carType: "",
//           status: "",
//         };

//     // ================= OTHER SCHEDULE =================
//     const otherBooking = await Booking.findOne({
//       "recipient.phone": user.phone, // Assuming 'bookedFor' uses recipient.phone for "others"
//       status: { $in: ["pending", "ongoing"] },
//       "days.date": today,
//     }).lean();

//     const otherToday = otherBooking
//       ? {
//           bookingId: otherBooking.bookingId,
//           dayNo: otherBooking.days.find((d: any) => d.date === today)?.dayNo || 0,
//           totalDays: otherBooking.daysCount,
//           scheduleEnd: otherBooking.days[otherBooking.days.length - 1]?.date || "",
//           carType: otherBooking.carType, // Added for UI
//           status: otherBooking.days.find((d: any) => d.date === today)?.status || "pending",
//         }
//       : {
//           bookingId: "",
//           dayNo: 0,
//           totalDays: 0,
//           scheduleEnd: "",
//           carType: "",
//           status: "",
//         };

//     // ================= BANNERS =================
//     const banners = await Banner.find({ active: true })
//       .sort({ index: 1 })
//       .select("index image link title") // Added title for banner text
//       .lean();

//     // ================= COUNTS =================
//     const totalBookings = await Booking.countDocuments({ userId });
//     const ongoing = await Booking.countDocuments({
//       userId,
//       status: "ongoing",
//     });
//     const completed = await Booking.countDocuments({
//       userId,
//       status: "completed",
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Home data fetched",
//         data: {
//           greeting: getGreeting(), // Added for "Good Morning [Name]"
//           user: {
//             name: user.name || "",
//             walletAmount: user.wallet || 0,
//             phone: user.phone || "",
//           },
//           banners: banners || [],
//           todayMySchedule: myToday,
//           todayOtherSchedule: otherToday,
//           stats: {
//             totalBookings,
//             ongoing,
//             completed,
//           },
//         },
//       },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("HOME API ERROR:", err);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Server error",
//         data: {},
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import User from "@/models/User";
import LearningConfig from "@/models/LearningConfig";
import { verifyAccessToken } from "@/lib/jwt";

function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
  } catch {
    return null;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json(
        { success: false, message: "Unauthorized", data: {} },
        { status: 401 }
      );

    const user = await User.findById(userId).lean();
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found", data: {} },
        { status: 404 }
      );

    const today = new Date().toISOString().split("T")[0];

    // 🔹 Load LearningConfig (fallback values if not found)
    const config =
      (await LearningConfig.findOne().lean()) || {
        perDayKmLimit: 10,
        totalLearningKm: 40,
      };

    const perDayKm = config.perDayKmLimit || 10;
    const totalKm = config.totalLearningKm || 40;

    // ================= TODAY — MY SCHEDULE =================
    const myBooking = await Booking.findOne({
      userId,
      status: { $in: ["pending", "ongoing"] },
      "days.date": today,
    }).lean();

    let todayMySchedule = {
      bookingId: "",
      label: "",
      dayNo: 0,
      totalDays: 0,
      todayKms: 0,
      totalKms: 0,
      remainingKms: 0,
      remainingDays: 0,
      scheduleEnd: "",
      carType: "",
      status: "",
    };

    if (myBooking) {
      const todayEntry = myBooking.days.find((d: any) => d.date === today);
      const dayNo = todayEntry?.dayNo || 0;
      const totalDays = myBooking.daysCount || myBooking.days?.length || 0;

      // 🔢 Distance calculations
      const calculatedTotalKms = dayNo * perDayKm;
      const remainingKms = Math.max(totalKm - calculatedTotalKms, 0);
      const remainingDays = Math.max(totalDays - dayNo, 0);

      todayMySchedule = {
        bookingId: myBooking.bookingId,
        label: `Day ${dayNo}`,
        dayNo,
        totalDays,
        todayKms: perDayKm,
        totalKms: calculatedTotalKms,
        remainingKms,
        remainingDays,
        scheduleEnd: myBooking.days?.at(-1)?.date || "",
        carType: myBooking.carType || "",
        status: todayEntry?.status || "pending",
      };
    }

    return NextResponse.json(
      {
        success: true,
        message: "Home data fetched",
        data: {
          greeting: getGreeting(),
          user: {
            name: user.fullName || user.name || "",
            walletAmount: user.wallet || 0,
          },
          todayMySchedule,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("HOME API ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Server error", data: {} },
      { status: 500 }
    );
  }
}
