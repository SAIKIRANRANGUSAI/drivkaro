import mongoose, { Schema, Document } from "mongoose";

export interface IPricing extends Document {
  carType: "Hatchback" | "Sedan" | "SUV";
  pricePerDay: number;
  gstPercent: number; // add this also (ex: 18%)
}

const PricingSchema = new Schema(
  {
    carType: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    gstPercent: { type: Number, default: 18 }, // default 18%
  },
  { timestamps: true }
);

export default mongoose.models.Pricing ||
  mongoose.model<IPricing>("Pricing", PricingSchema);
