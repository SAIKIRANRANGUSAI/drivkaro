import mongoose, { Schema } from "mongoose";

const FlashScreenSchema = new Schema(
  {
    image: String,
    heading: String,
    description: String,
  },
  { _id: false }
);

const LogSchema = new Schema(
  {
    ip: String,
    browser: String,
    os: String,
    time: Date,
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    logoUrl: { type: String, default: "" },

    flashScreens: [FlashScreenSchema],

    adminLogs: [LogSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);
