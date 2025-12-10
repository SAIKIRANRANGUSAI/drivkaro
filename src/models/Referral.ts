// src/models/Referral.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  referrer: mongoose.Types.ObjectId;
  referredUser: mongoose.Types.ObjectId;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  bonusAmount: number;
  bonusCredited: boolean;
  firstBookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referredUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    bonusAmount: { type: Number, required: true },
    bonusCredited: { type: Boolean, default: false },
    firstBookingId: { type: String },
  },
  { timestamps: true }
);

ReferralSchema.index({ referrer: 1, referredUser: 1 }, { unique: true });

export default mongoose.models.Referral ||
  mongoose.model<IReferral>("Referral", ReferralSchema);
