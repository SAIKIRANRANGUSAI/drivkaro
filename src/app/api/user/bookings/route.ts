// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Booking from "@/models/Booking";
// import Pricing from "@/models/Pricing";
// import Coupon from "@/models/Coupon";
// import User from "@/models/User";
// import { sendPushNotification } from "@/lib/sendNotification";

// function generateOtp() {
//   return Math.floor(1000 + Math.random() * 9000).toString();
// }

// /* ======================================================
//    GET USER BOOKINGS
//    GET /api/user/bookings?status=completed
// ====================================================== */
// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();

//     const userId = req.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         code: "USER_ID_MISSING",
//         message: "Missing x-user-id header",
//         data: {
//           bookings: [],
//         },
//       });
//     }

//     const status = req.nextUrl.searchParams.get("status");

//     const allowedStatuses = [
//       "pending",
//       "ongoing",
//       "completed",
//       "cancelled",
//     ];

//     const query: any = { userId };

//     if (status) {
//       if (!allowedStatuses.includes(status)) {
//         return NextResponse.json({
//           success: false,
//           code: "INVALID_STATUS",
//           message: "Invalid booking status",
//           data: {
//             bookings: [],
//           },
//         });
//       }

//       query.status = status;
//     }

//     const bookings = await Booking.find(query)
//       .sort({ createdAt: -1 })
//       .lean();

//     return NextResponse.json({
//       success: true,
//       code: "BOOKINGS_FETCHED",
//       message: "Bookings fetched successfully",
//       data: {
//         bookings: bookings || [],
//       },
//     });
//   } catch (error) {
//     console.error("BOOKINGS GET ERROR:", error);

//     return NextResponse.json({
//       success: false,
//       code: "SERVER_ERROR",
//       message: "Server error",
//       data: {
//         bookings: [],
//       },
//     });
//   }
// }

// /* ======================================================
//    CREATE BOOKING
//    POST /api/user/bookings
// ====================================================== */
// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     // ================= USER =================
//     const userId = req.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         code: "USER_ID_MISSING",
//         message: "Missing x-user-id header",
//         data: {},
//       });
//     }

//     // ================= REQUIRED FIELDS =================
//     const required = [
//       "pickupLocation",
//       "startDate",
//       "endDate",
//       "carType",
//       "slotTime",
//     ];

//     for (const field of required) {
//       if (!body[field]) {
//         return NextResponse.json({
//           success: false,
//           code: "FIELD_MISSING",
//           message: `${field} is required`,
//           data: {},
//         });
//       }
//     }

//     // ================= PICKUP =================
//     const pickup = body.pickupLocation;
//     if (!pickup?.name || pickup.lat == null || pickup.lng == null) {
//       return NextResponse.json({
//         success: false,
//         code: "INVALID_PICKUP_LOCATION",
//         message: "pickupLocation must have name, lat, lng",
//         data: {},
//       });
//     }

//     const dropLocation = body.dropLocation || pickup;

//     // ================= PRICING =================
//     const pricing = await Pricing.findOne({ carType: body.carType });
//     if (!pricing) {
//       return NextResponse.json({
//         success: false,
//         code: "PRICING_NOT_FOUND",
//         message: "Pricing not found for this car type",
//         data: {},
//       });
//     }

//     const pricePerDay = pricing.pricePerDay;
//     const gstPercent = pricing.gstPercent || 18;

//     // ================= DAYS =================
//     const days: any[] = [];
//     let current = new Date(body.startDate);
//     const end = new Date(body.endDate);
//     let dayNo = 1;

//     while (current <= end) {
//       days.push({
//         dayNo,
//         date: current.toISOString().split("T")[0],
//         slot: body.slotTime,
//         status: "pending",
//         startOtp: generateOtp(),
//         endOtp: generateOtp(),
//         instructorId: null,
//       });

//       current.setDate(current.getDate() + 1);
//       dayNo++;
//     }

//     const daysCount = days.length;

//     // ================= AMOUNT =================
//     const amount = pricePerDay * daysCount;
//     const gst = Math.round((amount * gstPercent) / 100);
//     let finalAmount = amount + gst;

//     // ================= COUPON =================
//     let discount = 0;

//     if (body.couponCode) {
//       const coupon = await Coupon.findOne({
//         code: body.couponCode.trim().toUpperCase(),
//         active: true,
//         from: { $lte: new Date() },
//         to: { $gte: new Date() },
//       });

//       if (coupon && amount >= coupon.minAmount) {
//         discount = coupon.isPercent
//           ? Math.round((amount * coupon.amount) / 100)
//           : coupon.amount;

//         if (discount > coupon.maxDiscount) discount = coupon.maxDiscount;
//         finalAmount -= discount;
//       }
//     }

//     // ================= WALLET =================
//     const walletUsed = Number(body.walletUsed || 0);
//     finalAmount -= walletUsed;
//     if (finalAmount < 0) finalAmount = 0;

//     // ================= BOOKED FOR =================
//     const bookedFor = body.bookedFor || "self";
//     const otherUserId = bookedFor === "other" ? body.otherUserId : null;

//     // ================= CREATE =================
//     const booking = await Booking.create({
//       userId,
//       bookingId: "BK" + Math.floor(100000 + Math.random() * 900000),

//       pickupLocation: pickup,
//       dropLocation,

//       carType: body.carType,
//       pricePerDay,
//       slotTime: body.slotTime,

//       daysCount,
//       days,

//       amount,
//       gst,
//       discount,
//       walletUsed,
//       totalAmount: finalAmount,

//       couponCode: body.couponCode || null,
//       bookedFor,
//       otherUserId,

//       paid: false,
//       assignedInstructorId: null,
//       assignedGender: null,
//       status: "pending",
//     });

//     // ================= NOTIFICATION =================
//     const user = await User.findById(userId);
//     if (user?.fcmToken) {
//       await sendPushNotification(
//         user.fcmToken,
//         "Booking Created 🎉",
//         `Your booking ${booking.bookingId} has been created successfully.`
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       code: "BOOKING_CREATED",
//       message: "Booking created successfully",
//       data: booking,
//     });
//   } catch (error) {
//     console.error("BOOKING POST ERROR:", error);

//     return NextResponse.json({
//       success: false,
//       code: "SERVER_ERROR",
//       message: "Server error",
//       data: {},
//     });
//   }
// }


// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Booking from "@/models/Booking";
// import Pricing from "@/models/Pricing";
// import User from "@/models/User";
// import { sendPushNotification } from "@/lib/sendNotification";
// import { verifyAccessToken } from "@/lib/jwt";

// function generateOtp() {
//   return Math.floor(1000 + Math.random() * 9000).toString();
// }

// // ================= HELPER =================
// function getUserIdFromToken(req: Request) {
//   const authHeader = req.headers.get("authorization");
//   if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

//   try {
//     const token = authHeader.split(" ")[1];
//     const decoded: any = verifyAccessToken(token);
//     return decoded.userId;
//   } catch {
//     return null;
//   }
// }

// /* ======================================================
//    GET USER BOOKINGS
//    GET /api/user/bookings?status=ongoing|completed|pending|cancelled
// ====================================================== */
// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();

//     const userId = getUserIdFromToken(req);
//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         code: "UNAUTHORIZED",
//         message: "Invalid or missing access token",
//         data: { bookings: [] },
//       });
//     }

//     const status = req.nextUrl.searchParams.get("status");

//     // 🔹 Always fetch all user bookings first
//     let bookings = await Booking.find({ userId })
//       .sort({ createdAt: -1 })
//       .lean();

//     // 🔹 App-based filtering
//     if (status === "ongoing") {
//       bookings = bookings.filter(
//         (b) => b.days?.some((d: any) => d.status !== "completed")
//       );
//     }

//     if (status === "completed") {
//       bookings = bookings.filter(
//         (b) =>
//           b.days?.length > 0 &&
//           b.days.every((d: any) => d.status === "completed")
//       );
//     }

//     if (status === "pending") {
//       bookings = bookings.filter((b) => b.status === "pending");
//     }

//     if (status === "cancelled") {
//       bookings = bookings.filter((b) => b.status === "cancelled");
//     }

//     return NextResponse.json({
//       success: true,
//       code: "BOOKINGS_FETCHED",
//       message: "Bookings fetched successfully",
//       data: { bookings },
//     });
//   } catch (error) {
//     console.error("BOOKINGS GET ERROR:", error);

//     return NextResponse.json({
//       success: false,
//       code: "SERVER_ERROR",
//       message: "Server error",
//       data: { bookings: [] },
//     });
//   }
// }

// /* ======================================================
//    CREATE BOOKING
//    POST /api/user/bookings
// ====================================================== */
// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const userId = getUserIdFromToken(req);
//     if (!userId) {
//       return NextResponse.json({
//         success: false,
//         code: "UNAUTHORIZED",
//         message: "Invalid or missing access token",
//         data: {},
//       });
//     }

//     const required = [
//       "pickupLocation",
//       "startDate",
//       "endDate",
//       "carType",
//       "slotTime",
//     ];

//     for (const field of required) {
//       if (!body[field]) {
//         return NextResponse.json({
//           success: false,
//           code: "FIELD_MISSING",
//           message: `${field} is required`,
//           data: {},
//         });
//       }
//     }

//     const pickup = body.pickupLocation;
//     if (!pickup?.name || pickup.lat == null || pickup.lng == null) {
//       return NextResponse.json({
//         success: false,
//         code: "INVALID_PICKUP_LOCATION",
//         message: "pickupLocation must have name, lat, lng",
//         data: {},
//       });
//     }

//     const dropLocation = body.dropLocation || pickup;

//     const pricing = await Pricing.findOne({ carType: body.carType });
//     if (!pricing) {
//       return NextResponse.json({
//         success: false,
//         code: "PRICING_NOT_FOUND",
//         message: "Pricing not found for this car type",
//         data: {},
//       });
//     }

//     const pricePerDay = pricing.pricePerDay;
//     const gstPercent = pricing.gstPercent || 18;

//     const days: any[] = [];
//     let current = new Date(body.startDate);
//     const end = new Date(body.endDate);
//     let dayNo = 1;

//     while (current <= end) {
//       days.push({
//         dayNo,
//         date: current.toISOString().split("T")[0],
//         slot: body.slotTime,
//         status: "pending",
//         startOtp: generateOtp(),
//         endOtp: generateOtp(),
//         instructorId: null,
//       });
//       current.setDate(current.getDate() + 1);
//       dayNo++;
//     }

//     const daysCount = days.length;
//     const amount = pricePerDay * daysCount;
//     const gst = Math.round((amount * gstPercent) / 100);
//     let finalAmount = amount + gst;

//     const walletUsed = Number(body.walletUsed || 0);
//     finalAmount -= walletUsed;
//     if (finalAmount < 0) finalAmount = 0;

//     const bookedFor = body.bookedFor || "self";
//     const otherUserId = bookedFor === "other" ? body.otherUserId : null;

//     const booking = await Booking.create({
//       userId,
//       bookingId: "BK" + Math.floor(100000 + Math.random() * 900000),
//       pickupLocation: pickup,
//       dropLocation,
//       carType: body.carType,
//       pricePerDay,
//       slotTime: body.slotTime,
//       daysCount,
//       days,
//       amount,
//       gst,
//       discount: 0,
//       walletUsed,
//       totalAmount: finalAmount,
//       couponCode: null,
//       bookedFor,
//       otherUserId,
//       paid: false,
//       assignedInstructorId: null,
//       assignedGender: null,
//       status: "pending",
//     });

//     const user = await User.findById(userId);
//     if (user?.fcmToken) {
//       await sendPushNotification(
//         user.fcmToken,
//         "Booking Created 🎉",
//         `Your booking ${booking.bookingId} has been created successfully.`
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       code: "BOOKING_CREATED",
//       message: "Booking created successfully",
//       data: booking,
//     });
//   } catch (error) {
//     console.error("BOOKING POST ERROR:", error);

//     return NextResponse.json({
//       success: false,
//       code: "SERVER_ERROR",
//       message: "Server error",
//       data: {},
//     });
//   }
// }

// E:\backup-projects\drivkaro\src\app\api\user\bookings\route.ts

// E:\backup-projects\drivkaro\src\app\api\user\bookings\route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Pricing from "@/models/Pricing";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";
import { verifyAccessToken } from "@/lib/jwt";

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getUserIdFromToken(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return (verifyAccessToken(h.split(" ")[1]) as any).userId;
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
    if (d.date < today && d.status === "pending" && !d.startOtp && !d.endOtp) {
  d.status = "missed";
  changed = true;
}

  });

  // Count missed and add extra days if needed
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
        instructorId: null
      });
      nextDate.setDate(nextDate.getDate() + 1);
    }
    await booking.save();
  }
}

/* ======================================================
   GET BOOKINGS (ONGOING / COMPLETED / PENDING / CANCELLED)
   and CURRENT BOOKING VIEW (no ID required)
   GET /api/user/bookings?status=ongoing|completed|pending|cancelled|current
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: { bookings: [] }
      }, { status: 401 });

    const status = req.nextUrl.searchParams.get("status");

    // Fetch all bookings for user, sorted by createdAt desc
    let bookings: any[] = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Apply missed logic for all bookings
    for (let booking of bookings) {
      await applyMissedDaysLogic(booking._id);
      // Re-fetch updated booking
      const updated = await Booking.findById(booking._id).lean();
      if (updated) Object.assign(booking, updated);
    }

    /* ---------- CURRENT BOOKING VIEW ---------- */
    if (status === "current") {
      // Find ongoing booking
      const ongoingBooking = bookings.find((b: any) =>
        b.days.some((d: any) => d.status === "pending" || d.status === "started")
      );

      if (!ongoingBooking)
        return NextResponse.json({
          success: true,
          message: "No active booking",
          data: null
        });

      const today = new Date().toISOString().split("T")[0];
      const todayDay = ongoingBooking.days.find((d: any) => d.date === today);

      // Ensure today's OTPs are generated
      if (todayDay && todayDay.status === "pending" && (!todayDay.startOtp || !todayDay.endOtp)) {

        const startOtp = generateOtp();
        const endOtp = generateOtp();
        await Booking.updateOne(
          { _id: ongoingBooking._id, "days.date": today },
          {
            $set: {
              "days.$.startOtp": startOtp,
              "days.$.endOtp": endOtp
            }
          }
        );
        // Update in memory
        if (todayDay) {
          todayDay.startOtp = startOtp;
          todayDay.endOtp = endOtp;
        }
      }

      // Get instructor from first assigned day
      const firstInstructor = ongoingBooking.days.find((d: any) => d.instructorId);
      const instructor = firstInstructor
        ? {
            id: firstInstructor.instructorId,
            name: firstInstructor.instructorName,
            phone: firstInstructor.instructorPhone,
            vehicleNumber: firstInstructor.instructorVehicleNumber,
            image: firstInstructor.instructorImage,
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


      return NextResponse.json({
        success: true,
        message: "Booking fetched",
        data: {
          booking: {
            bookingId: ongoingBooking.bookingId,
            bookingDate: ongoingBooking.createdAt,
            pickupLocation: ongoingBooking.pickupLocation?.name || null, // Same as drop
            carType: ongoingBooking.carType,
            startDate: ongoingBooking.days[0]?.date || null,
            endDate: ongoingBooking.days[ongoingBooking.days.length - 1]?.date || null,
            totalDays: ongoingBooking.days.length, // Updated after missed logic
            slotTime: ongoingBooking.slotTime,
            instructor,
            days: ongoingBooking.days.map((d: any) => ({
              dayNo: d.dayNo,
              date: d.date,
              slot: d.slot,
              status: d.status,
              startOtp: d.startOtp,
              endOtp: d.endOtp
            }))
          },
          todayOtp: todayDay
            ? {
                dayNo: todayDay.dayNo,
                date: todayDay.date,
                startOtp: todayDay.startOtp,
                endOtp: todayDay.endOtp,
                status: todayDay.status
              }
            : null
        }
      });
    }

    /* ---------- LIST ALL BOOKINGS WITH FILTERS ---------- */
    // Transform bookings for list view
    const transformedBookings = bookings.map((b: any) => {
      const totalDays = b.days?.length || 0;
      const startDate = b.days?.[0]?.date || null;
      const endDate = b.days?.[totalDays - 1]?.date || null;

      // Instructor from first assigned day or overall
      const dayInstructor = b.days?.find((d: any) => d.instructorId);
      const instructorAssigned = Boolean(b.assignedInstructorId || dayInstructor?.instructorId);
      const instructor = instructorAssigned
        ? {
            id: b.assignedInstructorId || dayInstructor?.instructorId,
            name: b.instructorName || dayInstructor?.instructorName || null,
            phone: b.instructorPhone || dayInstructor?.instructorPhone || null,
            vehicleNumber: b.instructorVehicleNumber || dayInstructor?.instructorVehicleNumber || null,
            image: b.instructorImage || dayInstructor?.instructorImage || null,
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


      return {
        bookingId: b.bookingId,
        bookingDate: b.createdAt,
        pickupLocation: b.pickupLocation?.name || null, // Same as drop
        carType: b.carType,
        bookingDates: { startDate, endDate },
        totalDays,
        slotTime: b.slotTime,
        instructor,
        status: b.status, // Booking level status
        days: b.days // Full days for potential use
      };
    });

    // Apply filters
    let filtered = transformedBookings;
    if (status === "ongoing")
      filtered = filtered.filter((b: any) =>
        b.days.some((d: any) => d.status !== "completed" && d.status !== "missed")
      );
    if (status === "completed")
      filtered = filtered.filter((b: any) =>
        b.days.every((d: any) => d.status === "completed" || d.status === "missed")
      );
    if (status === "pending")
      filtered = filtered.filter((b: any) => b.status === "pending");
    if (status === "cancelled")
      filtered = filtered.filter((b: any) => b.status === "cancelled");

    return NextResponse.json({
      success: true,
      message: "Bookings fetched",
      data: { bookings: filtered }
    });
  } catch (err) {
    console.error("BOOKING LIST ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
      data: { bookings: [] }
    }, { status: 500 });
  }
}

/* ======================================================
   CREATE BOOKING — ONLY ONE ACTIVE ALLOWED
====================================================== */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: {}
      }, { status: 401 });

    // Check for existing active booking
    const existingActive = await Booking.findOne({ userId }).lean();
    if (existingActive) {
      const hasActiveDays = existingActive.days.some(
        (d: any) => d.status === "pending" || d.status === "started"
      );
      if (hasActiveDays) {
        return NextResponse.json({
          success: false,
          message: "You already have an active booking. Complete or cancel it first.",
          data: {}
        });
      }
    }

    const required = [
      "pickupLocation",
      "startDate",
      "endDate",
      "carType",
      "slotTime"
    ];
    for (const f of required)
      if (!body[f])
        return NextResponse.json({
          success: false,
          message: `${f} is required`,
          data: {}
        }, { status: 400 });

    const pickup = body.pickupLocation;
    const dropLocation = body.dropLocation || pickup; // Same if not provided
    const pricing = await Pricing.findOne({ carType: body.carType });
    if (!pricing)
      return NextResponse.json({
        success: false,
        message: "Pricing not found for selected car type",
        data: {}
      }, { status: 404 });

    // Generate days
    const days: any[] = [];
    let cur = new Date(body.startDate);
    const end = new Date(body.endDate);
    let no = 1;
    while (cur <= end) {
      days.push({
        dayNo: no,
        date: cur.toISOString().split("T")[0],
        slot: body.slotTime,
        status: "pending",
        startOtp: null,
        endOtp: null,
        instructorId: null
      });
      cur.setDate(cur.getDate() + 1);
      no++;
    }

    // const booking = await Booking.create({
    //   userId,
    //   bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000), // Unique ID
    //   pickupLocation: pickup,
    //   dropLocation,
    //   carType: body.carType,
    //   pricePerDay: pricing.pricePerDay,
    //   slotTime: body.slotTime,
    //   daysCount: days.length,
    //   days,
    //   amount: 0, // Will be updated after payment
    //   gst: 0,
    //   totalAmount: 0,
    //   discount: 0,
    //   status: "pending"
    // });

    const booking = await Booking.create({
  userId,
  bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000),

  pickupLocation: pickup,
  dropLocation,

  // ⭐ REQUIRED — GeoJSON field used for nearby search
  pickupLocationPoint: {
    type: "Point",
    coordinates: [pickup.lng, pickup.lat]   // [lng, lat]
  },

  carType: body.carType,
  pricePerDay: pricing.pricePerDay,
  slotTime: body.slotTime,
  daysCount: days.length,
  days,

  preferredGender: body.preferredGender || null,

  amount: 0,
  gst: 0,
  totalAmount: 0,
  discount: 0,
  status: "pending"
});


    // Send notification
    await sendPushNotification(userId, "Booking Created", `Your booking ${booking.bookingId} has been placed successfully.`);

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      data: booking
    });
  } catch (err) {
    console.error("BOOKING CREATE ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
      data: {}
    }, { status: 500 });
  }
}

/* ======================================================
   CANCEL ALL BOOKINGS (SINCE ONLY ONE)
====================================================== */
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const userId = getUserIdFromToken(req);
    if (!userId)
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
        data: null
      }, { status: 401 });

    const booking = await Booking.findOne({ userId, status: { $ne: "cancelled" } });
    if (!booking)
      return NextResponse.json({
        success: false,
        message: "No active booking found",
        data: null
      }, { status: 404 });

    booking.status = "cancelled";
    await booking.save();

    // Send notification
    await sendPushNotification(userId, "Booking Cancelled", `Your booking ${booking.bookingId} has been cancelled.`);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      data: null
    });
  } catch (err) {
    console.error("BOOKING CANCEL ERROR:", err);
    return NextResponse.json({
      success: false,
      message: "Server error",
      data: null
    }, { status: 500 });
  }
}