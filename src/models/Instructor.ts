import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstructor extends Document {
  fullName: string;
  mobile: string;
  gender?: "male" | "female" | "other";
  dob?: Date;
  city?: string;
  carTypes?: string[]; // ["Hatchback","Sedan","SUV"]
  vehicleNumber?: string;
  dlNumber?: string;
  dlImageUrl?: string;
  idProofType?: string;
  idProofUrl?: string;
  status: "pending" | "approved" | "rejected" | "blocked";
}

const InstructorSchema = new Schema<IInstructor>(
  {
    fullName: { type: String, default: "" },

    mobile: { type: String, required: true, unique: true, index: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    city: { type: String },
    carTypes: [{ type: String }],
    vehicleNumber: { type: String },
    dlNumber: { type: String },
    dlImageUrl: { type: String },
    idProofType: { type: String },
    idProofUrl: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Instructor: Model<IInstructor> =
  mongoose.models.Instructor ||
  mongoose.model<IInstructor>("Instructor", InstructorSchema);

export default Instructor;
