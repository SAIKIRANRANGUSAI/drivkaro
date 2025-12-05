import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  email: string;
  password: string;   // plain text
  name: string;
  role: "admin" | "superadmin";
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // direct password
    name: { type: String, default: "" },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" }
  },
  { timestamps: true }
);

export default mongoose.models.Admin ||
  mongoose.model<IAdmin>("Admin", AdminSchema);
