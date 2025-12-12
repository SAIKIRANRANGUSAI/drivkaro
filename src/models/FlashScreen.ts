import mongoose, { Schema, Document } from "mongoose";

export interface IFlashScreen extends Document {
  image: string;
  heading: string;
  description: string;
}

const FlashScreenSchema = new Schema<IFlashScreen>(
  {
    image: { type: String, required: true },
    heading: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.FlashScreen ||
  mongoose.model<IFlashScreen>("FlashScreen", FlashScreenSchema);
