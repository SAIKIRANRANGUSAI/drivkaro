import mongoose, { Schema, Document } from "mongoose";

export interface IFlashScreen extends Document {
  image: string;
  heading: string;
  description: string;
}

const FlashScreenSchema = new Schema<IFlashScreen>(
  {
    // ❌ remove required
    image: { type: String, default: "" },

    heading: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.FlashScreen ||
  mongoose.model<IFlashScreen>("FlashScreen", FlashScreenSchema);
