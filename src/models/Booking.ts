import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Pricing from "@/models/Pricing";
import User from "@/models/User";
import { sendPushNotification } from "@/lib/sendNotification";
import { verifyAccessToken } from "@/lib/jwt";

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

// // ================= MISSED DAYS LOGIC =================
// async function applyMissedDaysLogic(bookingId: string) {
//   const booking: any = await Booking.findById(bookingId);
//   if (!booking) return;

//   const today = new Date().toISOString().split("T")[0];
//   let changed = false;

//   booking.days.forEach((d: any) => {
//     if (d.date < today && d.status === "pending") {
//       d.status = "missed";
//       changed = true;
//     }
//   });

//   const missedCount = booking.days.filter((d: any) => d.status === "missed").length;
//   if (missedCount > 0 && changed) {
//     let nextDate = new Date(booking.days[booking.days.length - 1].date);
//     nextDate.setDate(nextDate.getDate() + 1);

//     for (let i = 0; i < missedCount; i++) {
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

//     await booking.save();
//   }
// }

// /* ======================================================
//    GET BOOKINGS + CURRENT BOOKING
// ====================================================== */
// export async function GET(req: NextRequest) {
//   try {
//     await connectDB();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: { bookings: [] } },
//         { status: 401 }
//       );

//     const status = req.nextUrl.searchParams.get("status");

//     let bookings: any[] = await Booking.find({ userId })
//       .sort({ createdAt: -1 })
//       .lean();

//     for (let booking of bookings) {
//       await applyMissedDaysLogic(booking._id);
//       const updated = await Booking.findById(booking._id).lean();
//       if (updated) Object.assign(booking, updated);
//     }

//     /* ---------- CURRENT BOOKING ---------- */
//     if (status === "current") {
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

//       if (todayDay && (!todayDay.startOtp || !todayDay.endOtp)) {
//         const startOtp = generateOtp();
//         const endOtp = generateOtp();

//         await Booking.updateOne(
//           { _id: ongoingBooking._id, "days.date": today },
//           { $set: { "days.$.startOtp": startOtp, "days.$.endOtp": endOtp } }
//         );

//         todayDay.startOtp = startOtp;
//         todayDay.endOtp = endOtp;
//       }

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
//         : { assigned: false, message: "Instructor will be assigned soon" };

//       return NextResponse.json({
//         success: true,
//         message: "Booking fetched",
//         data: {
//           booking: {
//             bookingId: ongoingBooking.bookingId,
//             bookingDate: ongoingBooking.createdAt,
//             pickupLocation: ongoingBooking.pickupLocation?.name || null,
//             carType: ongoingBooking.carType,
//             startDate: ongoingBooking.days[0]?.date || null,
//             endDate: ongoingBooking.days.at(-1)?.date || null,
//             totalDays: ongoingBooking.days.length,
//             slotTime: ongoingBooking.slotTime,

//             preferredGender: ongoingBooking.preferredGender || null,
//             assignedGender: ongoingBooking.assignedGender || null,

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

//     /* ---------- LIST BOOKINGS ---------- */
//     const transformed = bookings.map((b: any) => {
//       const totalDays = b.days?.length || 0;

//       return {
//         bookingId: b.bookingId,
//         bookingDate: b.createdAt,
//         pickupLocation: b.pickupLocation?.name || null,
//         carType: b.carType,
//         bookingDates: {
//           startDate: b.days?.[0]?.date || null,
//           endDate: b.days?.[totalDays - 1]?.date || null
//         },
//         totalDays,
//         slotTime: b.slotTime,

//         preferredGender: b.preferredGender || null,
//         assignedGender: b.assignedGender || null,

//         status: b.status,
//         days: b.days
//       };
//     });

//     let filtered = transformed;
//     if (status === "ongoing")
//       filtered = filtered.filter((b: any) =>
//         b.days.some((d: any) => d.status !== "completed" && d.status !== "missed")
//       );
//     if (status === "completed")
//       filtered = filtered.filter((b: any) =>
//         b.days.every((d: any) => d.status === "completed" || d.status === "missed")
//       );
//     if (status === "pending") filtered = filtered.filter((b: any) => b.status === "pending");
//     if (status === "cancelled") filtered = filtered.filter((b: any) => b.status === "cancelled");

//     return NextResponse.json({
//       success: true,
//       message: "Bookings fetched",
//       data: { bookings: filtered }
//     });
//   } catch (err) {
//     console.error("BOOKING LIST ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: { bookings: [] } },
//       { status: 500 }
//     );
//   }
// }

// /* ======================================================
//    CREATE BOOKING — WITH GENDER PREFERENCE
// ====================================================== */
// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: {} },
//         { status: 401 }
//       );

//     // ACTIVE BOOKING CHECK
//     const existing = await Booking.findOne({ userId }).lean();
//     if (existing && existing.days.some((d: any) => d.status !== "completed"))
//       return NextResponse.json({
//         success: false,
//         message: "You already have an active booking",
//         data: {}
//       });

//     // REQUIRED FIELDS
//     const required = ["pickupLocation", "startDate", "endDate", "carType", "slotTime"];
//     for (const f of required)
//       if (!body[f])
//         return NextResponse.json(
//           { success: false, message: `${f} is required`, data: {} },
//           { status: 400 }
//         );

//     // ================= DRIVER PREFERENCE =================
//     let genderPref: "male" | "female" | null = null;

//     if (body.preferredGender) {
//       const g = String(body.preferredGender).toLowerCase();
//       if (!["male", "female"].includes(g))
//         return NextResponse.json(
//           { success: false, message: "preferredGender must be male or female", data: {} },
//           { status: 400 }
//         );
//       genderPref = g as "male" | "female";
//     }

//     const pickup = body.pickupLocation;
//     const dropLocation = body.dropLocation || pickup;

//     const pricing = await Pricing.findOne({ carType: body.carType });
//     if (!pricing)
//       return NextResponse.json(
//         { success: false, message: "Pricing not found", data: {} },
//         { status: 404 }
//       );

//     // DAYS GENERATION
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

//     const booking = await Booking.create({
//       userId,
//       bookingId: "BK" + Date.now() + Math.floor(Math.random() * 1000),
//       pickupLocation: pickup,
//       dropLocation,
//       carType: body.carType,
//       pricePerDay: pricing.pricePerDay,
//       slotTime: body.slotTime,

//       daysCount: days.length,
//       days,

//       preferredGender: genderPref,
//       assignedGender: null,

//       amount: 0,
//       gst: 0,
//       discount: 0,
//       totalAmount: 0,

//       status: "pending"
//     });

//     await sendPushNotification(
//       userId,
//       "Booking Created",
//       `Your booking ${booking.bookingId} has been placed successfully.`
//     );

//     return NextResponse.json({
//       success: true,
//       message: "Booking created successfully",
//       data: booking
//     });
//   } catch (err) {
//     console.error("BOOKING CREATE ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: {} },
//       { status: 500 }
//     );
//   }
// }

// /* ======================================================
//    CANCEL BOOKING
// ====================================================== */
// export async function DELETE(req: Request) {
//   try {
//     await connectDB();
//     const userId = getUserIdFromToken(req);
//     if (!userId)
//       return NextResponse.json(
//         { success: false, message: "Unauthorized", data: null },
//         { status: 401 }
//       );

//     const booking = await Booking.findOne({ userId, status: { $ne: "cancelled" } });
//     if (!booking)
//       return NextResponse.json(
//         { success: false, message: "No active booking found", data: null },
//         { status: 404 }
//       );

//     booking.status = "cancelled";
//     await booking.save();

//     await sendPushNotification(
//       userId,
//       "Booking Cancelled",
//       `Your booking ${booking.bookingId} has been cancelled.`
//     );

//     return NextResponse.json({
//       success: true,
//       message: "Booking cancelled successfully",
//       data: null
//     });
//   } catch (err) {
//     console.error("BOOKING CANCEL ERROR:", err);
//     return NextResponse.json(
//       { success: false, message: "Server error", data: null },
//       { status: 500 }
//     );
//   }
// }


import mongoose, { Schema, Document } from "mongoose";

/* ======================================================
   DAY OBJECT
====================================================== */
export interface IBookingDay {
  dayNo: number;
  date: string;
  slot: string;

  startOtp: string | null;
  endOtp: string | null;

  status: "pending" | "started" | "completed" | "missed" | "skipped";

  // Only link instructor — no duplicate details
  instructorId?: mongoose.Types.ObjectId | null;

  startedAt?: Date | null;
  completedAt?: Date | null;
}

/* ======================================================
   BOOKING DOCUMENT
====================================================== */
export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;

  bookingId: string;

  pickupLocation: { name: string; lat: number; lng: number };
  dropLocation: { name: string; lat: number; lng: number };

  pickupLocationPoint: {
    type: "Point";
    coordinates: number[]; // [lng, lat]
  };

  carType: string;
  pricePerDay: number;
  slotTime: string;

  daysCount: number;
  days: IBookingDay[];

  preferredGender?: "male" | "female" | null;
  assignedGender?: "male" | "female" | null;

  assignedInstructorId?: mongoose.Types.ObjectId | null;
  instructorName?: string | null;
  instructorPhone?: string | null;
  instructorImage?: string | null;
  instructorVehicleNumber?: string | null;

  paid: boolean;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  paymentTxnRef?: string | null;
  paymentVerifiedAt?: Date | null;

  status:
    | "pending"
    | "instructor_assigned"
    | "ongoing"
    | "completed"
    | "cancelled";
}


/* ======================================================
   DAY SCHEMA
====================================================== */
const BookingDaySchema = new Schema<IBookingDay>(
  {
    dayNo: { type: Number, required: true },
    date: { type: String, required: true },
    slot: { type: String, required: true },

    startOtp: { type: String, default: null },
    endOtp: { type: String, default: null },

    status: {
      type: String,
      enum: ["pending", "started", "completed", "missed", "skipped"],
      default: "pending",
    },

    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

/* ======================================================
   BOOKING SCHEMA
====================================================== */
const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    bookingId: { type: String, required: true, unique: true, index: true },

    pickupLocation: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    dropLocation: {
      name: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // ⭐ GeoJSON field for nearby-search
    pickupLocationPoint: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],   // [lng, lat]
        required: true,
      },
    },

    carType: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    slotTime: { type: String, required: true },

    daysCount: { type: Number, required: true },
    days: [BookingDaySchema],

    preferredGender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },
    assignedGender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },

    // ⭐ Instructor (booking level)
    assignedInstructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
    instructorName: { type: String, default: null },
    instructorPhone: { type: String, default: null },
    instructorImage: { type: String, default: null },
    instructorVehicleNumber: { type: String, default: null },

    // ⭐ Payment
    paid: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    paymentTxnRef: { type: String, default: null },
    paymentVerifiedAt: { type: Date, default: null },

    // ⭐ Pricing — required for payments
amount: { type: Number, default: 0 },        // base amount before GST
gst: { type: Number, default: 0 },
totalAmount: { type: Number, default: 0 },   // final payable amount
discount: { type: Number, default: 0 },


    status: {
      type: String,
      enum: [
        "pending",
        "instructor_assigned",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

// ⭐ IMPORTANT: enable geospatial queries
BookingSchema.index({ pickupLocationPoint: "2dsphere" });

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
