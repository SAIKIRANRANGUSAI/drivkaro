import mongoose from "mongoose";

const IssueSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      default: "",
    },

    serviceType: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "resolved", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Issue ||
  mongoose.model("Issue", IssueSchema);
