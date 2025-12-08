import mongoose from "mongoose";

// ⭐ Register models to avoid OverwriteModelError
import "@/models/User";
import "@/models/Booking";
import "@/models/OtherUser";

// -------------------
// Cache Type
// -------------------
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// -------------------
// Initialize Global Cache
// -------------------
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// -------------------
// Connect Function
// -------------------
export async function connectDB() {
  const MONGO_URI = process.env.MONGODB_URI;

  if (!MONGO_URI) {
    throw new Error("❌ MONGODB_URI not found in environment variables");
  }

  // If already connected, return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // If connection is already in progress, await it
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI as string, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("✔ MongoDB connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ⬇️⬇️⬇️ ADD THIS
export default connectDB;
