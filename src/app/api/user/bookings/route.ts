// // E:\backup-projects\drivkaro\src\app\api\user\bookings\route.ts
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

// function getUserIdFromToken(req: Request) {
//   const h = req.headers.get("authorization");
//   if (!h?.startsWith("Bearer ")) return null;
//   try {
//     return (verifyAccessToken(h.split(" ")[1]) as any).userId;
//   } catch {
//     return null;
//   }
// }

// // Helper to apply missed days logic
// async function applyMissedDaysLogic(bookingId: string) {
//   const booking: any = await Booking.findById(bookingId);
//   if (!booking) return;

//   // Safety — if days missing or invalid, stop
//   if (!Array.isArray(booking.days) || booking.days.length === 0) {
//     booking.days = [];
//     booking.daysCount = 0;
//     await booking.save();
//     return;
//   }

//   // Always sync daysCount safely
//   booking.daysCount = booking.days.length;

//   const today = new Date().toISOString().split("T")[0];
//   let changed = false;

//   booking.days.forEach((d: any) => {
//     if (d?.date < today && d?.status === "pending" && !d?.startOtp && !d?.endOtp) {
//       d.status = "missed";
//       changed = true;
//     }
//   });

//   const missedCount = booking.days.filter((d: any) => d?.status === "missed").length;
//   const extraNeeded = Math.min(missedCount, 10);

//   if (extraNeeded > 0 && changed) {
//     const lastDay = booking.days[booking.days.length - 1];

//     // Safety — avoid Invalid Date
//     if (!lastDay?.date) return;

//     let nextDate = new Date(lastDay.date);
//     nextDate.setDate(nextDate.getDate() + 1);

//     for (let i = 0; i < extraNeeded; i++) {
//       booking.days.push({
//         dayNo: booking.days.length + 1,
//         date: nextDate.toISOString().split("T")[0],
//         slot: booking.slotTime,
//         status: "pending",
//         startOtp: null,
//         endOtp: null,
//         instructorId: null
//       });
//       nextDate.setDate(nextDate.getDate() + 1);
//     }

//     booking.daysCount = booking.days.length; // keep synced
//     await booking.save();
//   }
// }


// /* ======================================================
//    GET BOOKINGS (ONGOING / COMPLETED / PENDING / CANCELLED)
//    and CURRENT BOOKING VIEW (no ID required)
//    GET /api/user/bookings?status=ongoing|completed|pending|cancelled|current
// ====================================================== */
// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json({
//         success: false,
//         message: "Unauthorized",
//         data: { bookings: [] }
//       }, { status: 401 });

//     const status = req.nextUrl.searchParams.get("status");

//     // Fetch all bookings for user, sorted by createdAt desc
//     let bookings: any[] = await Booking.find({ userId })
//       .sort({ createdAt: -1 })
//       .lean();

//     // Apply missed logic for all bookings
//     for (let booking of bookings) {
//       await applyMissedDaysLogic(booking._id);
//       // Re-fetch updated booking
//       const updated = await Booking.findById(booking._id).lean();
//       if (updated) Object.assign(booking, updated);
//     }

//     /* ---------- CURRENT BOOKING VIEW ---------- */
//     if (status === "current") {
//       // Find ongoing booking
//       const ongoingBooking = bookings.find((b: any) =>
//         b.days.some((d: any) => d.status === "pending" || d.status === "started")
//       );

//       if (!ongoingBooking)
//         return NextResponse.json({
//           success: true,
//           message: "No active booking",
//           data: null
//         });

//       const today = new Date().toISOString().split("T")[0];
//       const todayDay = ongoingBooking.days.find((d: any) => d.date === today);

//       // Ensure today's OTPs are generated
//       if (todayDay && todayDay.status === "pending" && (!todayDay.startOtp || !todayDay.endOtp)) {

//         const startOtp = generateOtp();
//         const endOtp = generateOtp();
//         await Booking.updateOne(
//           { _id: ongoingBooking._id, "days.date": today },
//           {
//             $set: {
//               "days.$.startOtp": startOtp,
//               "days.$.endOtp": endOtp
//             }
//           }
//         );
//         // Update in memory
//         if (todayDay) {
//           todayDay.startOtp = startOtp;
//           todayDay.endOtp = endOtp;
//         }
//       }

//       // Get instructor from first assigned day
//       const firstInstructor = ongoingBooking.days.find((d: any) => d.instructorId);
//       const instructor = firstInstructor
//         ? {
//             id: firstInstructor.instructorId,
//             name: firstInstructor.instructorName,
//             phone: firstInstructor.instructorPhone,
//             vehicleNumber: firstInstructor.instructorVehicleNumber,
//             image: firstInstructor.instructorImage,
//             assigned: true
//           }
//         : {
//     assigned: false,
//     id: null,
//     name: null,
//     phone: null,
//     vehicleNumber: null,
//     image: null
//   };


//       return NextResponse.json({
//         success: true,
//         message: "Booking fetched",
//         data: {
//           booking: {
//             bookingId: ongoingBooking.bookingId,
//             bookingDate: ongoingBooking.createdAt,
//             pickupLocation: ongoingBooking.pickupLocation?.name || null, // Same as drop
//             carType: ongoingBooking.carType,
//             startDate: ongoingBooking.days[0]?.date || null,
//             endDate: ongoingBooking.days[ongoingBooking.days.length - 1]?.date || null,
//             totalDays: ongoingBooking.days.length, // Updated after missed logic
//             slotTime: ongoingBooking.slotTime,
//             instructor,
//             days: ongoingBooking.days.map((d: any) => ({
//               dayNo: d.dayNo,
//               date: d.date,
//               slot: d.slot,
//               status: d.status,
//               startOtp: d.startOtp,
//               endOtp: d.endOtp
//             }))
//           },
//           todayOtp: todayDay
//             ? {
//                 dayNo: todayDay.dayNo,
//                 date: todayDay.date,
//                 startOtp: todayDay.startOtp,
//                 endOtp: todayDay.endOtp,
//                 status: todayDay.status
//               }
//             : null
//         }
//       });
//     }

//     /* ---------- LIST ALL BOOKINGS WITH FILTERS ---------- */
//     // Transform bookings for list view
//     const transformedBookings = bookings.map((b: any) => {
//       const totalDays = b.days?.length || 0;
//       const startDate = b.days?.[0]?.date || null;
//       const endDate = b.days?.[totalDays - 1]?.date || null;

//       // Instructor from first assigned day or overall
//       const dayInstructor = b.days?.find((d: any) => d.instructorId);
//       const instructorAssigned = Boolean(b.assignedInstructorId || dayInstructor?.instructorId);
//       const instructor = instructorAssigned
//         ? {
//             id: b.assignedInstructorId || dayInstructor?.instructorId,
//             name: b.instructorName || dayInstructor?.instructorName || null,
//             phone: b.instructorPhone || dayInstructor?.instructorPhone || null,
//             vehicleNumber: b.instructorVehicleNumber || dayInstructor?.instructorVehicleNumber || null,
//             image: b.instructorImage || dayInstructor?.instructorImage || null,
//             assigned: true
//           }
//           : {
//       assigned: false,
//       id: null,
//       name: null,
//       phone: null,
//       vehicleNumber: null,
//       image: null
//     };


//       return {
//         bookingId: b.bookingId,
//         bookingDate: b.createdAt,
//         pickupLocation: b.pickupLocation?.name || null, // Same as drop
//         carType: b.carType,
//         bookingDates: { startDate, endDate },
//         totalDays,
//         slotTime: b.slotTime,
//         instructor,
//         status: b.status,// Booking level status
//         days: b.days // Full days for potential use
//       };
//     });

//     // Apply filters
//     let filtered = transformedBookings;
//     if (status === "ongoing")
//   filtered = filtered.filter((b: any) =>
//     Array.isArray(b.days) &&
//     b.days.some((d: any) =>
//       d?.status !== "completed" &&
//       d?.status !== "missed"
//     )
//   );

//     if (status === "completed")
//   filtered = filtered.filter((b: any) => {
//     if (!Array.isArray(b.days) || b.days.length === 0) return false;

//     return b.days.every(
//       (d: any) =>
//         d?.status === "completed" ||
//         d?.status === "missed"
//     );
//   });

//     if (status === "pending")
//       filtered = filtered.filter((b: any) => b.status === "pending");
//     if (status === "cancelled")
//       filtered = filtered.filter((b: any) => b.status === "cancelled");

//     const cleaned = filtered.map((b: any) => {
//   const { days, ...rest } = b;   // remove days only in output
//   return rest;
// });

// return NextResponse.json({
//   success: true,
//   message: "Bookings fetched",
//   data: { bookings: cleaned }
// });

//   } catch (err) {
//     console.error("BOOKING LIST ERROR:", err);
//     return NextResponse.json({
//       success: false,
//       message: "Server error",
//       data: { bookings: [] }
//     }, { status: 500 });
//   }
// }

// /* ======================================================
//    CREATE BOOKING — ONLY ONE ACTIVE ALLOWED
// ====================================================== */
// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json({
//         success: false,
//         message: "Unauthorized",
//         data: {}
//       }, { status: 401 });

//     // Check for existing active booking
//     const existingActive = await Booking.findOne({ userId }).lean();
//     if (existingActive) {
//       const hasActiveDays = existingActive.days.some(
//         (d: any) => d.status === "pending" || d.status === "started"
//       );
//       if (hasActiveDays) {
//         return NextResponse.json({
//           success: false,
//           message: "You already have an active booking. Complete or cancel it first.",
//           data: {}
//         });
//       }
//     }

//     const required = [
//       "pickupLocation",
//       "startDate",
//       "endDate",
//       "carType",
//       "slotTime"
//     ];
//     for (const f of required)
//       if (!body[f])
//         return NextResponse.json({
//           success: false,
//           message: `${f} is required`,
//           data: {}
//         }, { status: 400 });

//     const pickup = body.pickupLocation;
//     const dropLocation = body.dropLocation || pickup; // Same if not provided
//     const pricing = await Pricing.findOne({ carType: body.carType });
//     if (!pricing)
//       return NextResponse.json({
//         success: false,
//         message: "Pricing not found for selected car type",
//         data: {}
//       }, { status: 404 });

//     // Generate days
//     const days: any[] = [];
//     let cur = new Date(body.startDate);
//     const end = new Date(body.endDate);
//     let no = 1;
//     while (cur <= end) {
//       days.push({
//         dayNo: no,
//         date: cur.toISOString().split("T")[0],
//         slot: body.slotTime,
//         status: "pending",
//         startOtp: null,
//         endOtp: null,
//         instructorId: null
//       });
//       cur.setDate(cur.getDate() + 1);
//       no++;
//     }

//     // const booking = await Booking.create({
//     //   userId,
//     //   bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000), // Unique ID
//     //   pickupLocation: pickup,
//     //   dropLocation,
//     //   carType: body.carType,
//     //   pricePerDay: pricing.pricePerDay,
//     //   slotTime: body.slotTime,
//     //   daysCount: days.length,
//     //   days,
//     //   amount: 0, // Will be updated after payment
//     //   gst: 0,
//     //   totalAmount: 0,
//     //   discount: 0,
//     //   status: "pending"
//     // });
//   const pricingData = body.pricing || {};

//   const booking = await Booking.create({
//   userId,
//   bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000),

//   pickupLocation: pickup,
//   dropLocation,

//   // ⭐ REQUIRED — GeoJSON field used for nearby search
//   pickupLocationPoint: {
//     type: "Point",
//     coordinates: [pickup.lng, pickup.lat]   // [lng, lat]
//   },

//   carType: body.carType,
//   pricePerDay: pricing.pricePerDay,
//   slotTime: body.slotTime,
//   daysCount: days.length,
//   days,

//   preferredGender: body.preferredGender || null,

//   amount: pricingData.bookingAmount || 0,
// gst: pricingData.gst || 0,
// totalAmount: pricingData.totalPrice || 0,
// discount: pricingData.coupon?.discount || 0,
// status: "pending"

// });


//     // Send notification
//     await sendPushNotification(userId, "Booking Created", `Your booking ${booking.bookingId} has been placed successfully.`);

//     return NextResponse.json({
//       success: true,
//       message: "Booking created successfully",
//       data: booking
//     });
//   } catch (err) {
//     console.error("BOOKING CREATE ERROR:", err);
//     return NextResponse.json({
//       success: false,
//       message: "Server error",
//       data: {}
//     }, { status: 500 });
//   }
// }



// /* ======================================================
//    CANCEL ALL BOOKINGS (SINCE ONLY ONE)
// ====================================================== */
// export async function DELETE(req: Request) {
//   try {
//     await connectDB();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json({
//         success: false,
//         message: "Unauthorized",
//         data: null
//       }, { status: 401 });

    

    
//     const booking = await Booking.findOne({ userId, status: { $ne: "cancelled" } });
//     if (!booking)
//       return NextResponse.json({
//         success: false,
//         message: "No active booking found",
//         data: null
//       }, { status: 404 });

//     booking.status = "cancelled";
//     await booking.save();

//     // Send notification
//     await sendPushNotification(userId, "Booking Cancelled", `Your booking ${booking.bookingId} has been cancelled.`);

//     return NextResponse.json({
//       success: true,
//       message: "Booking cancelled successfully",
//       data: null
//     });
//   } catch (err) {
//     console.error("BOOKING CANCEL ERROR:", err);
//     return NextResponse.json({
//       success: false,
//       message: "Server error",
//       data: null
//     }, { status: 500 });
//   }
// }




// E:\backup-projects\drivkaro\src\app\api\user\bookings\route.ts
import { NextRequest, NextResponse } from "next/server";
import Payment from "@/models/Payment";

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

  if (!Array.isArray(booking.days) || booking.days.length === 0) {
    booking.days = [];
    booking.daysCount = 0;
    await booking.save();
    return;
  }

  booking.daysCount = booking.days.length;

  const today = new Date().toISOString().split("T")[0];
  let changed = false;

  booking.days.forEach((d: any) => {
    if (d?.date < today && d?.status === "pending" && !d?.startOtp && !d?.endOtp) {
      d.status = "missed";
      changed = true;
    }
  });

  const missedCount = booking.days.filter((d: any) => d?.status === "missed").length;
  const extraNeeded = Math.min(missedCount, 10);

  if (extraNeeded > 0 && changed) {
    const lastDay = booking.days[booking.days.length - 1];
    if (!lastDay?.date) return;

    let nextDate = new Date(lastDay.date);
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

    booking.daysCount = booking.days.length;
    await booking.save();
  }
}

/* ======================================================
   GET BOOKINGS
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

    let bookings: any[] = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    for (let booking of bookings) {
      await applyMissedDaysLogic(booking._id);
      const updated = await Booking.findById(booking._id).lean();
      if (updated) Object.assign(booking, updated);
    }

    if (status === "current") {
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

        todayDay.startOtp = startOtp;
        todayDay.endOtp = endOtp;
      }

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
            pickupLocation: ongoingBooking.pickupLocation?.name || null,
            carType: ongoingBooking.carType,
            startDate: ongoingBooking.days[0]?.date || null,
            endDate: ongoingBooking.days[ongoingBooking.days.length - 1]?.date || null,
            totalDays: ongoingBooking.days.length,
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

    const transformedBookings = bookings.map((b: any) => {
      const totalDays = b.days?.length || 0;
      const startDate = b.days?.[0]?.date || null;
      const endDate = b.days?.[totalDays - 1]?.date || null;

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
        pickupLocation: b.pickupLocation?.name || null,
        carType: b.carType,
        bookingDates: { startDate, endDate },
        totalDays,
        slotTime: b.slotTime,
        instructor,
        status: b.status,
        days: b.days
      };
    });

    let filtered = transformedBookings;
    if (status === "ongoing")
      filtered = filtered.filter((b: any) =>
        Array.isArray(b.days) &&
        b.days.some((d: any) => d?.status !== "completed" && d?.status !== "missed")
      );

    if (status === "completed")
      filtered = filtered.filter((b: any) => {
        if (!Array.isArray(b.days) || b.days.length === 0) return false;
        return b.days.every(
          (d: any) => d?.status === "completed" || d?.status === "missed"
        );
      });

    if (status === "pending")
      filtered = filtered.filter((b: any) => b.status === "pending");

    if (status === "cancelled")
      filtered = filtered.filter((b: any) => b.status === "cancelled");

    const cleaned = filtered.map((b: any) => {
      const { days, ...rest } = b;
      return rest;
    });

    return NextResponse.json({
      success: true,
      message: "Bookings fetched",
      data: { bookings: cleaned }
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
   CREATE BOOKING — ONLY AFTER PAYMENT SUCCESS
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

    /* -----------------------------------------
       1️⃣  PAYMENT VALIDATION (REQUIRED)
    ----------------------------------------- */
    const paymentId = body.paymentId;
    if (!paymentId) {
      return NextResponse.json({
        success: false,
        message: "paymentId is required",
        data: {}
      }, { status: 400 });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment || payment.userId.toString() !== userId.toString()) {
      return NextResponse.json({
        success: false,
        message: "Invalid or missing payment",
        data: {}
      }, { status: 400 });
    }

    // Allow full-wallet SUCCESS & Razorpay SUCCESS
    if (payment.status !== "SUCCESS") {
      return NextResponse.json({
        success: false,
        message: "Payment not completed. Booking cannot be created.",
        data: {}
      }, { status: 400 });
    }

    // Prevent re-using the same payment
    if (payment.bookingId) {
      return NextResponse.json({
        success: false,
        message: "Payment already used for another booking.",
        data: {}
      }, { status: 400 });
    }

    /* -----------------------------------------
       2️⃣  USER MUST NOT HAVE ACTIVE BOOKING
    ----------------------------------------- */
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

    /* -----------------------------------------
       3️⃣  FIELD VALIDATION
    ----------------------------------------- */
    const required = ["pickupLocation", "startDate", "endDate", "carType", "slotTime"];
    for (const f of required)
      if (!body[f])
        return NextResponse.json({
          success: false,
          message: `${f} is required`,
          data: {}
        }, { status: 400 });

    const pickup = body.pickupLocation;
    const dropLocation = body.dropLocation || pickup;

    const pricing = await Pricing.findOne({ carType: body.carType });
    if (!pricing)
      return NextResponse.json({
        success: false,
        message: "Pricing not found for selected car type",
        data: {}
      }, { status: 404 });

    /* -----------------------------------------
       4️⃣  GENERATE DAYS
    ----------------------------------------- */
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

    const pricingData = body.pricing || {};

    /* -----------------------------------------
       5️⃣  CREATE BOOKING (PAID & ONGOING)
    ----------------------------------------- */
    const booking = await Booking.create({
      userId,
      bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000),

      pickupLocation: pickup,
      dropLocation,

      pickupLocationPoint: {
        type: "Point",
        coordinates: [pickup.lng, pickup.lat]
      },

      carType: body.carType,
      pricePerDay: pricing.pricePerDay,
      slotTime: body.slotTime,
      daysCount: days.length,
      days,

      preferredGender: body.preferredGender || null,

      amount: pricingData.bookingAmount || 0,
      gst: pricingData.gst || 0,
      totalAmount: pricingData.totalPrice || 0,
      discount: pricingData.coupon?.discount || 0,

      paid: true,
      paymentStatus: "SUCCESS",
      status: "ongoing",

      paymentTxnRef: paymentId
    });

    /* -----------------------------------------
       6️⃣  LINK PAYMENT → BOOKING
    ----------------------------------------- */
    await Payment.updateOne(
      { _id: paymentId },
      { bookingId: booking._id }
    );

    /* -----------------------------------------
       7️⃣  NOTIFICATION
    ----------------------------------------- */
    await sendPushNotification(
      userId,
      "Booking Created",
      `Your booking ${booking.bookingId} has been placed successfully.`
    );

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
   CANCEL BOOKING
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

    await sendPushNotification(
      userId,
      "Booking Cancelled",
      `Your booking ${booking.bookingId} has been cancelled.`
    );

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
