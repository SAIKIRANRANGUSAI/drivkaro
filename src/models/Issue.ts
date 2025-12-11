import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  userId: mongoose.Types.ObjectId;
  bookingId?: string;
  instructorId?: mongoose.Types.ObjectId;

  issueType: "driver" | "vehicle" | "payment" | "other";
  message: string;

  status: "pending" | "resolved";
}

const IssueSchema = new Schema<IIssue>(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String },
    instructorId: { type: mongoose.Types.ObjectId, ref: "Instructor" },

    issueType: {
      type: String,
      enum: ["driver", "vehicle", "payment", "other"],
      required: true,
    },

    message: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Issue ||
  mongoose.model<IIssue>("Issue", IssueSchema);
