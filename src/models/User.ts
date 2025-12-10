// src/models/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName?: string;
  mobile: string;
  email?: string;
  gender?: "male" | "female" | "other" | null;
  dob?: Date;

  // === REFERRAL SYSTEM ===
  referralCode?: string; // My unique code
  referredBy?: mongoose.Types.ObjectId | null; // Who referred me
  usedReferralCode?: string | null; // Which code I used

  walletAmount?: number;
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: { type: String, default: "" },
    mobile: { type: String, required: true, unique: true },

    gender: { type: String, enum: ["male", "female", "other"], default: null },

    email: { type: String, default: "" },
    dob: { type: Date },

    // === REFERRAL ATTRIBUTES ===
    referralCode: { type: String, index: true, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedReferralCode: { type: String, default: null }, // 👈 NEW

    walletAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// === INDEXES (FASTER SEARCH) ===
UserSchema.index({ mobile: 1 }, { unique: true });
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
