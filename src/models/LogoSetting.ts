import mongoose, { Schema, Document } from "mongoose";

export interface ILogoSetting extends Document {
  logoUrl: string;
}

const LogoSettingSchema = new Schema<ILogoSetting>(
  {
    logoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.LogoSetting ||
  mongoose.model<ILogoSetting>("LogoSetting", LogoSettingSchema);
