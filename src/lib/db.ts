import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI missing in .env");
}

export default async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "drivkaro",
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
}
