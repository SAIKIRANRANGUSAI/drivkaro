import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  amount: number;
  isPercent: boolean;
  active: boolean;
  from: Date;
  to: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    isPercent: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.models.Coupon ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);
