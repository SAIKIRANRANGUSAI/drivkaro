import mongoose, { Schema, Document } from "mongoose";

export interface IPricing extends Document {
  carType: "Hatchback" | "Sedan" | "SUV";
  pricePerDay: number;
  gstPercent: number;
  image: string;
}

const PricingSchema = new Schema(
  {
    carType: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 },
    image: { type: String, required: true }, // ✅ NEW
  },
  { timestamps: true }
);

export default mongoose.models.Pricing ||
  mongoose.model<IPricing>("Pricing", PricingSchema);