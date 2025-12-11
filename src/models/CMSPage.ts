import mongoose, { Schema, Document } from "mongoose";

export interface ICMSPage extends Document {
  page: "about" | "privacy" | "terms";
  content: string;
}

const CMSPageSchema = new Schema<ICMSPage>(
  {
    page: {
      type: String,
      enum: ["about", "privacy", "terms"],
      required: true,
      unique: true,
    },
    content: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.models.CMSPage ||
  mongoose.model<ICMSPage>("CMSPage", CMSPageSchema);
