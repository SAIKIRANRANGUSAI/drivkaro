// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongoose";

// import Booking from "@/models/Booking";
// import Coupon from "@/models/Coupon";
// import Pricing from "@/models/Pricing";

// // OPTIONAL – implement your real Razorpay order later
// async function createRazorpayOrder(amount, bookingId) {
//   return {
//     orderId: "test_order_" + bookingId,
//     amount: amount * 100,
//     currency: "INR"
//   };
// }

// export async function POST(req) {
//   try {
//     await connectDB();

//     const body = await req.json();

//     const {
//       pickupLocation,
//       carType,
//       daysCount,
//       startDate,
//       slot,
//       preferredGender,
//       couponCode,
//       bookedFor,
//       otherUserId
//     } = body;

//     // ---------------------------
//     // Validate user id
//     // ---------------------------
//     const userId = req.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "User ID missing" },
//         { status: 401 }
//       );
//     }

//     if (!pickupLocation || !carType || !daysCount || !startDate || !slot) {
//       return NextResponse.json(
//         { success: false, message: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     // ---------------------------
//     // 1) BUILD DAYS LIST
//     // ---------------------------
//     const days = [];
//     let current = new Date(startDate);

//     for (let i = 0; i < daysCount; i++) {
//       days.push({
//         date: current.toISOString().slice(0, 10),
//         slot,
//         status: "pending",
//       });
//       current.setDate(current.getDate() + 1);
//     }

//     // ---------------------------
//     // 2) DYNAMIC PRICING FROM DB
//     // ---------------------------
//     const pricing = await Pricing.findOne({ carType, days: daysCount });

//     if (!pricing) {
//       return NextResponse.json(
//         { success: false, message: "No pricing found for this package" },
//         { status: 400 }
//       );
//     }

//     const baseAmount = pricing.price;

//     // ---------------------------
//     // 3) APPLY COUPON
//     // ---------------------------
//     let discount = 0;

//     if (couponCode) {
//       const today = new Date();

//       const coupon = await Coupon.findOne({
//         code: couponCode,
//         active: true,
//         from: { $lte: today },
//         to: { $gte: today },
//       });

//       if (coupon) {
//         discount = coupon.isPercent
//           ? Math.round((baseAmount * coupon.amount) / 100)
//           : coupon.amount;
//       }
//     }

//     // ---------------------------
//     // 4) GST
//     // ---------------------------
//     const gst = Math.round((baseAmount - discount) * 0.18);

//     const totalAmount = baseAmount - discount + gst;

//     // ---------------------------
//     // 5) CREATE BOOKING
//     // ---------------------------
//     const booking = await Booking.create({
//       userId,
//       bookingId: "BK" + Math.floor(100000 + Math.random() * 900000),

//       pickupLocation,
//       dropLocation: pickupLocation, // SAME as requirement

//       carType,
//       daysCount,
//       days,

//       preferredGender: preferredGender || null,
//       couponCode: couponCode || null,

//       amount: baseAmount,
//       discount,
//       gst,
//       totalAmount,
//       paid: false,

//       bookedFor: bookedFor || "self",
//       otherUserId: bookedFor === "other" ? otherUserId : null,

//       status: "pending",
//     });

//     // ---------------------------
//     // 6) CREATE RAZORPAY ORDER
//     // ---------------------------
//     const order = await createRazorpayOrder(totalAmount, booking._id);

//     return NextResponse.json(
//       { success: true, booking, order },
//       { status: 201 }
//     );

//   } catch (err) {
//     console.error("BOOKING ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server Error" },
//       { status: 500 }
//     );
//   }
// }





// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongoose";

// import Booking from "@/models/Booking";
// import Pricing from "@/models/Pricing";
// import Coupon from "@/models/Coupon";

// export async function POST(req: Request) {
//   try {
//     await connectDB();

//     const body = await req.json();
//     const {
//       pickupLocation,
//       carType,
//       daysCount,
//       startDate,
//       slot,
//       preferredGender,
//       couponCode,
//       bookedFor,
//       otherUserId,
//     } = body;

//     const userId = req.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, message: "User ID missing" },
//         { status: 400 }
//       );
//     }

//     // 1) Pricing
//     const priceRule = await Pricing.findOne({ carType, days: daysCount });
//     if (!priceRule) {
//       return NextResponse.json(
//         { success: false, message: "Pricing not found" },
//         { status: 400 }
//       );
//     }

//     let amount = priceRule.price;
//     let discount = 0;

//     // 2) Coupon
//     if (couponCode) {
//       const c = await Coupon.findOne({
//         code: couponCode,
//         active: true,
//         from: { $lte: new Date() },
//         to: { $gte: new Date() },
//       });

//       if (c) {
//         discount = c.isPercent ? (amount * c.amount) / 100 : c.amount;
//       }
//     }

//     const gst = Math.round((amount - discount) * 0.18);
//     const totalAmount = amount - discount + gst;

//     // 3) Generate calendar days
//     const days = [];
//     let cur = new Date(startDate);

//     for (let i = 0; i < daysCount; i++) {
//       days.push({
//         date: cur.toISOString().slice(0, 10),
//         slot,
//         status: "pending",
//         startOTP: null,
//         endOTP: null,
//         startedAt: null,
//         endedAt: null,
//         isMissed: false,
//       });

//       cur.setDate(cur.getDate() + 1);
//     }

//     // 4) Create booking
//     const bookingId =
//       "BK" + Math.floor(100000 + Math.random() * 900000).toString();

//     const booking = await Booking.create({
//       userId,
//       bookingId,
//       pickupLocation,
//       dropLocation: pickupLocation,
//       carType,
//       daysCount,
//       days,
//       preferredGender: preferredGender || null,
//       couponCode: couponCode || null,
//       amount,
//       discount,
//       gst,
//       totalAmount,
//       paid: false,
//       bookedFor: bookedFor || "self",
//       otherUserId: otherUserId || null,
//       instructorId: null,
//       status: "pending",
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         booking,
//       },
//       { status: 201 }
//     );
//   } catch (err) {
//     console.error("BOOKING ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server Error" },
//       { status: 500 }
//     );
//   }
// }






import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";


// ---------------------------------------------
// CREATE BOOKING  (POST)
// ---------------------------------------------
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "User ID missing" }, { status: 400 });
    }

    // ===========================================
    // 1. Generate days array from date range
    // ===========================================
    const days: any[] = [];
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    let current = new Date(start);

    while (current <= end) {
      days.push({
        date: current.toISOString().split("T")[0], // yyyy-mm-dd
        slot: body.slotTime,
        status: "pending",       // default
        startOtp: null,
        endOtp: null
      });

      current.setDate(current.getDate() + 1);
    }

    // ===========================================
    // 2. Create Booking
    // ===========================================
    const newBooking = await Booking.create({
      userId,
      bookingId: "BK" + Math.floor(100000 + Math.random() * 900000),
      pickupLocation: body.pickupLocation,
      dropLocation: body.dropLocation,
      carType: body.carType,
      daysCount: days.length,
      days,
      preferredGender: body.preferredGender,
      couponCode: body.couponCode,
      amount: body.amount,
      gst: body.gst,
      discount: body.discount,
      totalAmount: body.totalAmount,
      bookedFor: body.bookedFor || "self",
      otherUserId: body.otherUserId || null,
      status: "pending",
    });

    return NextResponse.json(
      { success: true, booking: newBooking },
      { status: 201 }
    );

  } catch (error) {
    console.error("BOOKING POST ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}




// ---------------------------------------------
// LIST BOOKINGS  (GET)
// ---------------------------------------------
export async function GET(req: Request) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Read query param
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // can be pending, confirmed, ongoing…

    const filter: any = { userId };

    if (status) {
      filter.status = status;   // <- very important
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    console.error("BOOKING LIST ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
