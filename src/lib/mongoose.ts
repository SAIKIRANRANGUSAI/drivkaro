import mongoose from "mongoose";

// ⭐ IMPORTANT: Load all models BEFORE connectDB is called
import "@/models/User";
import "@/models/Booking";
import "@/models/OtherUser";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI;

  if (!MONGO_URI) {
    throw new Error("❌ MONGODB_URI not found in .env");
  }

  // If already connected, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If connecting is already in progress, await it
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("✔ MongoDB connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
