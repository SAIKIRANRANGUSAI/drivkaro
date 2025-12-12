import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  target: "all" | "users" | "instructors" | "single";
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    target: { type: String, enum: ["all", "users", "instructors", "single"], required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
