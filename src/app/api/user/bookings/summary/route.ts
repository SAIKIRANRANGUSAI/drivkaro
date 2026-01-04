// import { NextRequest, NextResponse } from "next/server";
// import connectDB from "@/lib/mongoose";
// import Pricing from "@/models/Pricing";
// import Coupon from "@/models/Coupon";

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     // ================= REQUIRED =================
//     const required = [
//       "pickupLocation",
//       "startDate",
//       "endDate",
//       "carType",
//       "slotTime",
//     ];

//     for (const field of required) {
//       if (!body[field]) {
//         return NextResponse.json(
//           {
//             success: false,
//             code: "FIELD_MISSING",
//             message: `${field} is required`,
//             data: {},
//           },
//           { status: 200 } // 👈 always 200
//         );
//       }
//     }

//     // ================= PRICING =================
//     const pricing = await Pricing.findOne({ carType: body.carType });
//     if (!pricing) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "PRICING_NOT_FOUND",
//           message: "Pricing not found",
//           data: {},
//         },
//         { status: 200 }
//       );
//     }

//     const pricePerDay = pricing.pricePerDay;
//     const gstPercent = pricing.gstPercent || 18;

//     // ================= DAYS COUNT =================
//     const start = new Date(body.startDate);
//     const end = new Date(body.endDate);

//     if (start > end) {
//       return NextResponse.json(
//         {
//           success: false,
//           code: "INVALID_DATES",
//           message: "Start date cannot be after end date",
//           data: {},
//         },
//         { status: 200 }
//       );
//     }

//     const daysCount =
//       Math.floor(
//         (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
//       ) + 1;

//     // ================= AMOUNT =================
//     const bookingAmount = pricePerDay * daysCount;
//     const gst = Math.round((bookingAmount * gstPercent) / 100);
//     let totalPrice = bookingAmount + gst;

//     // ================= COUPON =================
//     let couponDiscount = 0;
//     let couponStatus: "APPLIED" | "INVALID" | "NOT_PROVIDED" = "NOT_PROVIDED";

//     if (body.couponCode) {
//       const coupon = await Coupon.findOne({
//         code: body.couponCode.trim().toUpperCase(),
//         active: true,
//         from: { $lte: new Date() },
//         to: { $gte: new Date() },
//       });

//       if (!coupon || bookingAmount < coupon.minAmount) {
//         couponStatus = "INVALID";
//       } else {
//         couponStatus = "APPLIED";

//         couponDiscount = coupon.isPercent
//           ? Math.round((bookingAmount * coupon.amount) / 100)
//           : coupon.amount;

//         if (couponDiscount > coupon.maxDiscount) {
//           couponDiscount = coupon.maxDiscount;
//         }

//         totalPrice -= couponDiscount;
//       }
//     }

//     if (totalPrice < 0) totalPrice = 0;

//     // ================= RESPONSE =================
//     return NextResponse.json(
//       {
//         success: true,
//         code: "BOOKING_SUMMARY",
//         message: "Booking summary calculated",
//         data: {
//           bookingAmount,
//           gst,
//           coupon: {
//             status: couponStatus,
//             discount: couponDiscount,
//           },
//           totalPrice,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("SUMMARY API ERROR:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         code: "SERVER_ERROR",
//         message: "Server error",
//         data: {},
//       },
//       { status: 200 }
//     );
//   }
// }



// E:\backup-projects\drivkaro\src\app\api\user\bookings\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Pricing from "@/models/Pricing";
import Coupon from "@/models/Coupon";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    /* ---------- REQUIRED FIELDS ---------- */
    const required = [
      "pickupLocation",
      "startDate",
      "endDate",
      "carType",
      "slotTime"
    ];

    for (const f of required) {
      if (!body[f]) {
        return NextResponse.json({
          success: false,
          code: "FIELD_MISSING",
          message: `${f} is required`,
          data: {}
        }, { status: 200 });
      }
    }

    /* ---------- PICKUP LOCATION VALIDATION ---------- */
    const pickup = body.pickupLocation;

    if (
      !pickup.lat ||
      !pickup.lng ||
      typeof pickup.lat !== "number" ||
      typeof pickup.lng !== "number"
    ) {
      return NextResponse.json({
        success: false,
        code: "INVALID_LOCATION",
        message: "pickupLocation must contain valid lat & lng",
        data: {}
      }, { status: 200 });
    }

    const pickupLocationPoint = {
      type: "Point",
      coordinates: [pickup.lng, pickup.lat]
    };

    /* ---------- PRICING ---------- */
    const pricing = await Pricing.findOne({ carType: body.carType });

    if (!pricing) {
      return NextResponse.json({
        success: false,
        code: "PRICING_NOT_FOUND",
        message: "Pricing not found for selected car type",
        data: {}
      }, { status: 200 });
    }

    const pricePerDay = pricing.pricePerDay;
    const gstPercent = pricing.gstPercent || 18;

    /* ---------- DATE VALIDATION ---------- */
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    if (start > end) {
      return NextResponse.json({
        success: false,
        code: "INVALID_DATES",
        message: "Start date cannot be after end date",
        data: {}
      }, { status: 200 });
    }

    const daysCount =
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    /* ---------- BASE AMOUNT ---------- */
    const bookingAmount = pricePerDay * daysCount;
    const gst = Math.round((bookingAmount * gstPercent) / 100);

    let totalPrice = bookingAmount + gst;

    /* ---------- COUPON ---------- */
    let couponDiscount = 0;
    let couponStatus: "APPLIED" | "INVALID" | "NOT_PROVIDED" = "NOT_PROVIDED";

    if (body.couponCode) {
      const cleanCode = body.couponCode.trim().toUpperCase();
      const now = new Date();

      const coupon = await Coupon.findOne({ code: cleanCode, active: true });

      if (!coupon) couponStatus = "INVALID";
      else if (coupon.from && new Date(coupon.from) > now) couponStatus = "INVALID";
      else if (coupon.to && new Date(coupon.to) < now) couponStatus = "INVALID";
      else if (bookingAmount < coupon.minAmount) couponStatus = "INVALID";
      else {
        couponStatus = "APPLIED";

        couponDiscount = coupon.isPercent
          ? Math.round((bookingAmount * coupon.amount) / 100)
          : coupon.amount;

        if (couponDiscount > coupon.maxDiscount)
          couponDiscount = coupon.maxDiscount;

        totalPrice -= couponDiscount;
      }
    }

    if (totalPrice < 0) totalPrice = 0;

    /* ---------- RESPONSE ---------- */
    return NextResponse.json({
      success: true,
      code: "BOOKING_SUMMARY",
      message: "Booking summary calculated",
      data: {
        // pickupLocation: pickup,
        // pickupLocationPoint,
        // startDate: body.startDate,
        // endDate: body.endDate,
        // slotTime: body.slotTime,
        // carType: body.carType,

        // preferredGender: body.preferredGender || null,

        pricing: {
          pricePerDay,
          daysCount,
          bookingAmount,
          gst,
          coupon: {
            status: couponStatus,
            discount: couponDiscount
          },
          totalPrice
        }
      }
    }, { status: 200 });

  } catch (err) {
    console.error("SUMMARY API ERROR:", err);
    return NextResponse.json({
      success: false,
      code: "SERVER_ERROR",
      message: "Server error",
      data: {}
    }, { status: 200 });
  }
}
