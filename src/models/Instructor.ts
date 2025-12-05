import mongoose, { Schema } from "mongoose";

const InstructorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  carTypes: [{ type: String }],         // e.g. ["Hatchback","Sedan"]
  gender: { type: String, enum: ["male","female"], required: true },
  location: { type: String },           // city/area or geo coords (string or GeoJSON)
  availableSlots: [{ date: String, slots: [String] }], // optional schedule
  verified: { type: Boolean, default: false },
  online: { type: Boolean, default: true }, // driver availability status
}, { timestamps: true });

export default mongoose.models.Instructor || mongoose.model("Instructor", InstructorSchema);
