import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  bookingId: string;  // 🔥 String, NOT ObjectId
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  rating: number;
  message?: string;
}

const ReviewSchema = new Schema<IReview>(
  {
    // bookingId is plain string like "BK918019"
    bookingId: { type: String, required: true },

    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Types.ObjectId, ref: "Instructor", required: true },

    rating: { type: Number, min: 1, max: 5, required: true },

    message: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);
