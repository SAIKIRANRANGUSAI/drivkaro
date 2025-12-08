import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  amount: number;
  isPercent: boolean;
  active: boolean;
  from: Date;
  to: Date;

  minAmount: number;       // NEW 🚀
  maxDiscount: number;     // NEW 🚀

  maxUsagePerUser: number;
  usedBy: Array<{
    userId: mongoose.Types.ObjectId;
    count: number;
  }>;
}

const CouponSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    isPercent: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },

    // ADD THESE FIELDS ⭐⭐⭐
    minAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 999999 },

    maxUsagePerUser: { type: Number, default: 1 },

    usedBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Coupon ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);
