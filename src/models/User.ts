import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName?: string;
  mobile: string;
  email?: string;
  gender?: "male" | "female" | "other" | null;
  dob?: Date;
  referralCode?: string;
  referredBy?: mongoose.Types.ObjectId | null;
  walletAmount?: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, default: "" },
    mobile: { type: String, required: true, unique: true },

    // FIXED ❗
    gender: { type: String, enum: ["male", "female", "other"], default: null },

    email: { type: String, default: "" },
    dob: { type: Date },
    referralCode: { type: String, default: "" },
    referredBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    walletAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
