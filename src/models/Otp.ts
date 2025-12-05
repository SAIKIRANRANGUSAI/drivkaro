// src/models/Otp.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  phone: string;
  otpHash: string;
  expiresAt: Date;
  used?: boolean;
}

const OtpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index → auto delete after expiry
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
