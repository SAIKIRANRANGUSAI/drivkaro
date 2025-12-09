import mongoose, { Schema, Document } from "mongoose";

export interface IBookingDay {
  dayNo: number;                    // 1,2,3...
  date: string;                     // yyyy-mm-dd
  slot: string;                     // ex: "06:00 AM"

  startOtp: string;                 // always string
  endOtp: string;                   // always string

  status: "pending" | "started" | "completed" | "missed";

  instructorId?: mongoose.Types.ObjectId | null;
  instructorName?: string | null;
  instructorPhone?: string | null;

  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;

  bookingId: string;

  pickupLocation: {
    name: string;
    lat: number;
    lng: number;
  };

  dropLocation: {
    name: string;
    lat: number;
    lng: number;
  };

  carType: string;
  pricePerDay: number;

  slotTime: string;

  daysCount: number;
  days: IBookingDay[];

  preferredGender?: "male" | "female" | null;
  assignedGender?: "male" | "female" | null;

  couponCode?: string | null;
  amount: number;
  gst: number;
  discount: number;
  totalAmount: number;
  walletUsed?: number;

  paid: boolean;
  paymentStatus?: string | null;
  paymentTxnRef?: string | null;

  bookedFor: "self" | "other";
  otherUserId?: mongoose.Types.ObjectId | null;

  assignedInstructorId?: mongoose.Types.ObjectId | null;

  status: "pending" | "instructor_assigned" | "ongoing" | "completed" | "cancelled";
}

const BookingDaySchema = new Schema<IBookingDay>(
  {
    dayNo: { type: Number, required: true },

    date: { type: String, required: true },
    slot: { type: String, required: true },

    startOtp: { type: String, default: "" },
    endOtp: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "started", "completed", "missed"],
      default: "pending",
    },

    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },

    instructorName: { type: String, default: null },
    instructorPhone: { type: String, default: null },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true, // faster lookup
    },

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

    carType: { type: String, required: true },
    pricePerDay: { type: Number, required: true },

    slotTime: { type: String, required: true },

    daysCount: { type: Number, required: true },
    days: [BookingDaySchema],

    preferredGender: { type: String, enum: ["male", "female"], default: null },
    assignedGender: { type: String, enum: ["male", "female"], default: null },

    couponCode: { type: String, default: null },
    amount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },

    walletUsed: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paymentStatus: { type: String, default: null },
    paymentTxnRef: { type: String, default: null },

    bookedFor: { type: String, enum: ["self", "other"], default: "self" },
    otherUserId: { type: Schema.Types.ObjectId, ref: "OtherUser", default: null },

    assignedInstructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "instructor_assigned", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
