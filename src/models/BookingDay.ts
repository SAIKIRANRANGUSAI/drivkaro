import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingDay extends Document {
  booking: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD (same as URL param)
  dayNumber?: number; // optional if you want
  status: "pending" | "ongoing" | "completed" | "missed";
  startOtp?: string;
  endOtp?: string;
  startVerifiedAt?: Date;
  endVerifiedAt?: Date;
}

const BookingDaySchema = new Schema<IBookingDay>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    date: { type: String, required: true }, // "2025-12-20"
    dayNumber: { type: Number },
    status: {
      type: String,
      enum: ["pending", "ongoing", "completed", "missed"],
      default: "pending",
    },
    startOtp: { type: String },
    endOtp: { type: String },
    startVerifiedAt: { type: Date },
    endVerifiedAt: { type: Date },
  },
  { timestamps: true }
);

BookingDaySchema.index({ booking: 1, date: 1 }, { unique: true });

const BookingDay: Model<IBookingDay> =
  mongoose.models.BookingDay ||
  mongoose.model<IBookingDay>("BookingDay", BookingDaySchema);

export default BookingDay;
