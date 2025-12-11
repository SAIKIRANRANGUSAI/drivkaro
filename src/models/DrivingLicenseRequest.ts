import mongoose, { Schema, Document } from "mongoose";

export interface ILicenseRequest extends Document {
  bookingId: string;  // 🔥 String, not ObjectId
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  wantsLicense: boolean;
  status: "pending" | "processing" | "completed";
}

const LicenseSchema = new Schema<ILicenseRequest>(
  {
    // BookingId is a normal string: example → "BK918019"
    bookingId: { type: String, required: true },

    // Valid MongoDB references
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Types.ObjectId, ref: "Instructor", required: true },

    wantsLicense: { type: Boolean, required: true },

    status: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.models.LicenseRequest ||
  mongoose.model<ILicenseRequest>("LicenseRequest", LicenseSchema);
