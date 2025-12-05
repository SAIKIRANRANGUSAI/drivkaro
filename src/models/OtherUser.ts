import mongoose, { Schema } from "mongoose";

const OtherUserSchema = new Schema(
  {
    ownerUserId: { type: mongoose.Types.ObjectId, required: true, ref: "User" }, // the main user who created this other person
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    dob: { type: Date },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

// Index to quickly find owner’s other-users
OtherUserSchema.index({ ownerUserId: 1 });

export default mongoose.models.OtherUser ||
  mongoose.model("OtherUser", OtherUserSchema);
