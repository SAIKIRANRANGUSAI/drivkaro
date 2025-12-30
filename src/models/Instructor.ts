// models/Instructor.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstructor extends Document {
  fullName: string;
  mobile: string;

  registrationNumber?: string;
  ownerName?: string;
  email?: string;

  // ===== Location =====
  areaName?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type: "Point";
    coordinates: number[]; // [lng, lat]
  };

  // ===== Vehicle Details =====
  carType?: string;
  fuelType?: string;
  brand?: string;
  model?: any;
  purchaseYear?: string;
  vehicleNumber?: string;
  rcBookUrl?: string;
  carImages?: string[];

  // ===== Legacy / Profile Fields =====
  gender?: "male" | "female" | "other";
  dob?: Date;
  city?: string;
  carTypes?: string[];

  dlNumber?: string;

  dlImageFrontUrl?: string;
  dlImageBackUrl?: string;

  dlImageUrl?: string;
  idProofType?: string;
  idProofUrl?: string;

  // ===== Profile Review Status =====
  status: "pending" | "approved" | "rejected" | "blocked";

  rejectionMessage?: string;
  approvedAt?: Date;
  rejectedAt?: Date;

  wallet: number;

  // ===== Driver Duty / Availability (NEW) =====
  dutyStatus?: "offline" | "online" | "busy";
  lastActiveAt?: Date;
}

const InstructorSchema = new Schema<IInstructor>(
  {
    fullName: { type: String, default: "" },
    mobile: { type: String, required: true, unique: true, index: true },

    registrationNumber: { type: String },
    ownerName: { type: String },
    email: { type: String },

    // ===== Location / Service Area =====
    areaName: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },

    // ===== Vehicle Details =====
    carType: { type: String, default: "" },
    fuelType: { type: String, default: "" },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    purchaseYear: { type: String, default: "" },
    vehicleNumber: { type: String, default: "" },
    rcBookUrl: { type: String, default: "" },
    carImages: [{ type: String, default: "" }],

    // ===== Profile / Legacy =====
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    city: { type: String },
    carTypes: [{ type: String }],

    dlNumber: { type: String },

    dlImageFrontUrl: { type: String },
    dlImageBackUrl: { type: String },

    dlImageUrl: { type: String },
    idProofType: { type: String },
    idProofUrl: { type: String },

    // ===== Profile Review Status =====
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },

    rejectionMessage: { type: String, default: "" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },

    wallet: { type: Number, default: 0 },

    // ===== Driver Duty / Availability (NEW) =====
    dutyStatus: {
      type: String,
      enum: ["offline", "online", "busy"],
      default: "offline"
    },

    lastActiveAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// ===== Important for 15KM nearby orders =====
InstructorSchema.index({ location: "2dsphere" });

const Instructor: Model<IInstructor> =
  mongoose.models.Instructor ||
  mongoose.model<IInstructor>("Instructor", InstructorSchema);

export default Instructor;
