import mongoose, { Schema, models, model } from "mongoose";

const BannerSchema = new Schema(
  {
    index: { type: Number, required: true },
    image: { type: String, required: true },
    link: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Prevent model re-compilation issues
const Banner =
  models.Banner || model("Banner", BannerSchema);

export default Banner;
