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

// ================= HELPER =================
function getUserIdFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = verifyAccessToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
}

/* ======================================================
   GET USER BOOKINGS
   GET /api/user/bookings?status=completed
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Invalid or missing access token",
        data: { bookings: [] },
      });
    }

    const status = req.nextUrl.searchParams.get("status");
    const allowedStatuses = ["pending", "ongoing", "completed", "cancelled"];

    const query: any = { userId };

    // if (status) {
    //   if (!allowedStatuses.includes(status)) {
    //     return NextResponse.json({
    //       success: false,
    //       code: "INVALID_STATUS",
    //       message: "Invalid booking status",
    //       data: { bookings: [] },
    //     });
    //   }
    //   query.status = status;
    // }

    let bookings = await Booking.find({ userId })
  .sort({ createdAt: -1 })
  .lean();

if (status === "ongoing") {
  bookings = bookings.filter(b =>
    b.days?.some(d => d.status !== "completed")
  );
}

if (status === "completed") {
  bookings = bookings.filter(b =>
    b.days?.length > 0 &&
    b.days.every(d => d.status === "completed")
  );
}

if (status === "pending") {
  bookings = bookings.filter(b =>
    b.status === "pending"
  );
}

if (status === "cancelled") {
  bookings = bookings.filter(b =>
    b.status === "cancelled"
  );
}


    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      code: "BOOKINGS_FETCHED",
      message: "Bookings fetched successfully",
      data: { bookings },
    });
  } catch (error) {
    console.error("BOOKINGS GET ERROR:", error);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: { bookings: [] },
    });
  }
}

/* ======================================================
   CREATE BOOKING
   POST /api/user/bookings
====================================================== */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // ================= USER =================
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return NextResponse.json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Invalid or missing access token",
        data: {},
      });
    }

    // ================= REQUIRED FIELDS =================
    const required = [
      "pickupLocation",
      "startDate",
      "endDate",
      "carType",
      "slotTime",
    ];

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          code: "FIELD_MISSING",
          message: `${field} is required`,
          data: {},
        });
      }
    }

    // ================= PICKUP =================
    const pickup = body.pickupLocation;
    if (!pickup?.name || pickup.lat == null || pickup.lng == null) {
      return NextResponse.json({
        success: false,
        code: "INVALID_PICKUP_LOCATION",
        message: "pickupLocation must have name, lat, lng",
        data: {},
      });
    }

    const dropLocation = body.dropLocation || pickup;

    // ================= PRICING =================
    const pricing = await Pricing.findOne({ carType: body.carType });
    if (!pricing) {
      return NextResponse.json({
        success: false,
        code: "PRICING_NOT_FOUND",
        message: "Pricing not found for this car type",
        data: {},
      });
    }

    const pricePerDay = pricing.pricePerDay;
    const gstPercent = pricing.gstPercent || 18;

    // ================= DAYS =================
    const days: any[] = [];
    let current = new Date(body.startDate);
    const end = new Date(body.endDate);
    let dayNo = 1;

    while (current <= end) {
      days.push({
        dayNo,
        date: current.toISOString().split("T")[0],
        slot: body.slotTime,
        status: "pending",
        startOtp: generateOtp(),
        endOtp: generateOtp(),
        instructorId: null,
      });

      current.setDate(current.getDate() + 1);
      dayNo++;
    }

    const daysCount = days.length;

    // ================= AMOUNT =================
    const amount = pricePerDay * daysCount;
    const gst = Math.round((amount * gstPercent) / 100);
    let finalAmount = amount + gst;

    // ================= WALLET =================
    const walletUsed = Number(body.walletUsed || 0);
    finalAmount -= walletUsed;
    if (finalAmount < 0) finalAmount = 0;

    // ================= BOOKED FOR =================
    const bookedFor = body.bookedFor || "self";
    const otherUserId = bookedFor === "other" ? body.otherUserId : null;

    // ================= CREATE =================
    const booking = await Booking.create({
      userId,
      bookingId: "BK" + Math.floor(100000 + Math.random() * 900000),

      pickupLocation: pickup,
      dropLocation,

      carType: body.carType,
      pricePerDay,
      slotTime: body.slotTime,

      daysCount,
      days,

      amount,
      gst,
      discount: 0,        // ✅ kept for schema safety
      walletUsed,
      totalAmount: finalAmount,

      couponCode: null,   // ✅ coupon removed
      bookedFor,
      otherUserId,

      paid: false,
      assignedInstructorId: null,
      assignedGender: null,
      status: "pending",
    });

    // ================= NOTIFICATION =================
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendPushNotification(
        user.fcmToken,
        "Booking Created 🎉",
        `Your booking ${booking.bookingId} has been created successfully.`
      );
    }

    return NextResponse.json({
      success: true,
      code: "BOOKING_CREATED",
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("BOOKING POST ERROR:", error);

    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: {},
    });
  }
}
