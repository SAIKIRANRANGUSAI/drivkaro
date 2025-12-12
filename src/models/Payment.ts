import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    razorpayOrderId: { type: String },
    amount: { type: Number, required: true },
    walletUsed: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    rawResponse: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
