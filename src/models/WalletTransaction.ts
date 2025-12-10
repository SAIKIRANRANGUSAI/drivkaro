import mongoose, { Schema, Document } from "mongoose";

export interface IWalletTransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  type: string;
  referenceId?: string;
  remark?: string;
}

const WalletTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["REFERRAL_BONUS", "BOOKING_PAYMENT", "REFUND"],
      required: true,
    },
    referenceId: { type: String },
    remark: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>(
    "WalletTransaction",
    WalletTransactionSchema
  );
