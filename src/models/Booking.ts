import mongoose, { Schema, Document } from "mongoose";

export interface IBookingDay {
  date: string;         // ISO date (yyyy-mm-dd)
  slot: string;         // e.g. "06:00 AM"
  startOtp?: string;    // generated per-day
  endOtp?: string;
  status: "pending"|"started"|"completed"|"missed";
  instructorId?: mongoose.Types.ObjectId | null;
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  bookingId: string;
  pickupLocation: string;
  dropLocation: string;
  carType: string;
  daysCount: number;
  days: IBookingDay[];
  preferredGender?: "male"|"female"|null;
  couponCode?: string | null;
  amount: number;       // base amount
  gst: number;
  discount: number;
  totalAmount: number;  // final payable
  paid: boolean;
  bookedFor: "self"|"other";
  otherUserId?: mongoose.Types.ObjectId | null;
  assignedInstructorId?: mongoose.Types.ObjectId | null;
  status: "pending"|"instructor_assigned"|"ongoing"|"completed"|"cancelled";
}

const BookingDaySchema = new Schema(
  {
    date: { type: String, required: true },
    slot: { type: String, required: true },
    startOtp: { type: String, default: null },
    endOtp: { type: String, default: null },
    status: { type: String, enum: ["pending","started","completed","missed"], default: "pending" },
    instructorId: { type: Schema.Types.ObjectId, ref: "Instructor", default: null },
  },
  { _id: false }
);

const BookingSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String, required: true, unique: true },

    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },

    carType: { type: String, required: true },
    daysCount: { type: Number, required: true },
    days: [BookingDaySchema],

    preferredGender: { type: String, enum: ["male","female"], default: null },

    // payment
    couponCode: { type: String, default: null },
    amount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },

    // who booking for
    bookedFor: { type: String, enum: ["self","other"], default: "self" },
    otherUserId: { type: Schema.Types.ObjectId, ref: "OtherUser", default: null },

    // assignment
    assignedInstructorId: { type: Schema.Types.ObjectId, ref: "Instructor", default: null },

    status: { type: String, enum: ["pending","instructor_assigned","ongoing","completed","cancelled"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
