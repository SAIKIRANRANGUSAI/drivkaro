import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName?: string;
  mobile: string;
  email?: string;
  gender?: "male" | "female" | "other" | null;
  dob?: Date;
  profileImage?: string; // ✅ NEW

  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId | null;
  usedReferralCode?: string | null;

  walletAmount?: number;
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: { type: String, default: "" },
    mobile: { type: String, required: true, unique: true },

    email: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other"], default: null },
    dob: { type: Date },

    profileImage: { type: String, default: "" }, // ✅ NEW

    referralCode: { type: String, index: true, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedReferralCode: { type: String, default: null },

    walletAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
