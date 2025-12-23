import mongoose from "mongoose";

const LearningConfigSchema = new mongoose.Schema(
  {
    perDayKmLimit: {
      type: Number,
      required: true,
      default: 10,
    },

    totalLearningKm: {
      type: Number,
      required: true,
      default: 40,
    },

    selectableDays: {
      type: [Number], // [4, 8, 12]
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.LearningConfig ||
  mongoose.model("LearningConfig", LearningConfigSchema);
