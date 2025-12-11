import mongoose, { Schema, Document } from "mongoose";

export interface ILicenseRequest extends Document {
  bookingId: string;  
  userId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  wantsLicense: boolean;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "contacted"
    | "accepted"
    | "not_interested"
    | "ongoing"
    | "rejected";
}

const LicenseSchema = new Schema<ILicenseRequest>(
  {
    bookingId: { type: String, required: true },

    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    driverId: { type: mongoose.Types.ObjectId, ref: "Instructor", required: true },

    wantsLicense: { type: Boolean, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",

        // Admin statuses
        "contacted",
        "accepted",
        "not_interested",
        "ongoing",
        "rejected"
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.LicenseRequest ||
  mongoose.model<ILicenseRequest>("LicenseRequest", LicenseSchema);
