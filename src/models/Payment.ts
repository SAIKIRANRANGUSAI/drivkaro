import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    // booking will be attached AFTER booking creation
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      required: false
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    razorpayOrderId: { type: String },

    amount: { type: Number, required: true },
    walletUsed: { type: Number, default: 0 },

    // CREATED → when order generated
    // PENDING → waiting for Razorpay payment
    // SUCCESS → wallet/full payment done
    // FAILED → payment failed or cancelled
    status: {
      type: String,
      enum: ["CREATED", "PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    },

    // WALLET | RAZORPAY
    paidVia: {
      type: String,
      enum: ["WALLET", "RAZORPAY"],
      default: "RAZORPAY"
    },

    rawResponse: { type: Object }
  },
  { timestamps: true }
);

export default mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);
