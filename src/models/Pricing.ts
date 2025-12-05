import mongoose, { Schema, Document } from "mongoose";

export interface IPricing extends Document {
  carType: "Hatchback" | "Sedan" | "SUV";
  days: number;                 // Example: 7, 10, 15, 20
  price: number;                // Example: 3500
}

const PricingSchema = new Schema(
  {
    carType: { type: String, required: true },
    days: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Pricing ||
  mongoose.model<IPricing>("Pricing", PricingSchema);
