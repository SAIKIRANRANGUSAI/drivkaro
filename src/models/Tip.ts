import mongoose, { Schema, Document } from "mongoose";

export interface ITip extends Document {
  bookingId: string;  // 🔥 String, NOT ObjectId
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  amount: number;
  message?: string;
  status: "pending" | "paid";
}

const TipSchema = new Schema<ITip>(
  {
    bookingId: { type: String, required: true }, // 🔥 FIXED

    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Types.ObjectId, ref: "Instructor", required: true },

    amount: { type: Number, required: true },
    message: { type: String },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.models.Tip ||
  mongoose.model<ITip>("Tip", TipSchema);
