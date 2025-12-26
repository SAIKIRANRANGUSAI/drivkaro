import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstructor extends Document {
  fullName: string;                      // Driving School Name
  mobile: string;

  // School & Owner details
  registrationNumber?: string;
  ownerName?: string;
  email?: string;

  // Old fields (still supported)
  gender?: "male" | "female" | "other";
  dob?: Date;
  city?: string;
  carTypes?: string[];

  vehicleNumber?: string;
  dlNumber?: string;

  // New DL images
  dlImageFrontUrl?: string;
  dlImageBackUrl?: string;

  // Old fields (legacy support)
  dlImageUrl?: string;
  idProofType?: string;
  idProofUrl?: string;

  status: "pending" | "approved" | "rejected" | "blocked";

  rejectionMessage?: string;
  approvedAt?: Date;
  rejectedAt?: Date;

  wallet: number;
}

const InstructorSchema = new Schema<IInstructor>(
  {
    fullName: { type: String, default: "" }, // Driving School Name

    mobile: { type: String, required: true, unique: true, index: true },

    // ===== Driving School Fields =====
    registrationNumber: { type: String },
    ownerName: { type: String },
    email: { type: String },

    // ===== Legacy personal profile (optional) =====
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    city: { type: String },
    carTypes: [{ type: String }],

    // ===== Vehicle / License =====
    vehicleNumber: { type: String },
    dlNumber: { type: String },

    // ===== New DL Upload fields =====
    dlImageFrontUrl: { type: String },
    dlImageBackUrl: { type: String },

    // ===== Old fields (still safe to keep) =====
    dlImageUrl: { type: String },
    idProofType: { type: String },
    idProofUrl: { type: String },

    // ===== Status Flow =====
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },

    rejectionMessage: { type: String, default: "" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },

    // Wallet
    wallet: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Instructor: Model<IInstructor> =
  mongoose.models.Instructor ||
  mongoose.model<IInstructor>("Instructor", InstructorSchema);

export default Instructor;
