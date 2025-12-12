import mongoose, { Schema } from "mongoose";

const AdminLogSchema = new Schema(
  {
    ip: { type: String },
    browser: { type: String },
    os: { type: String },
    time: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.AdminLog ||
  mongoose.model("AdminLog", AdminLogSchema);
