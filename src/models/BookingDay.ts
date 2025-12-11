import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBookingDay extends Document {
  booking: mongoose.Types.ObjectId;

  date: string;                // yyyy-mm-dd
  dayNumber?: number;

  status: "pending" | "started" | "completed" | "missed";

  startOtp?: string;
  endOtp?: string;

  startVerifiedAt?: Date | null;
  endVerifiedAt?: Date | null;

  missedAt?: Date | null;

  // ⭐ Instructor details for the session
  instructorId?: mongoose.Types.ObjectId | null;
  instructorName?: string | null;
  instructorPhone?: string | null;
}

const BookingDaySchema = new Schema<IBookingDay>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    date: { type: String, required: true }, // yyyy-mm-dd
    dayNumber: { type: Number },

    status: {
      type: String,
      enum: ["pending", "started", "completed", "missed"],
      default: "pending",
    },

    startOtp: { type: String, default: "" },
    endOtp: { type: String, default: "" },

    startVerifiedAt: { type: Date, default: null },
    endVerifiedAt: { type: Date, default: null },

    missedAt: { type: Date, default: null },

    // ⭐ Instructor data saved for each session/day
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
    instructorName: { type: String, default: null },
    instructorPhone: { type: String, default: null },
  },
  { timestamps: true }
);

// Prevent duplicate day entries for same booking
BookingDaySchema.index({ booking: 1, date: 1 }, { unique: true });

const BookingDay: Model<IBookingDay> =
  mongoose.models.BookingDay ||
  mongoose.model<IBookingDay>("BookingDay", BookingDaySchema);

export default BookingDay;
