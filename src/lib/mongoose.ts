// import mongoose from "mongoose";

// // ⭐ Register models to avoid OverwriteModelError
// import "@/models/User";
// import "@/models/Booking";
// import "@/models/OtherUser";

// // -------------------
// // Cache Type
// // -------------------
// interface MongooseCache {
//   conn: typeof mongoose | null;
//   promise: Promise<typeof mongoose> | null;
// }

// // -------------------
// // Initialize Global Cache
// // -------------------
// let cached = (global as any).mongoose as MongooseCache;

// if (!cached) {
//   cached = (global as any).mongoose = { conn: null, promise: null };
// }

// // -------------------
// // Connect Function
// // -------------------
// export async function connectDB() {
//   const MONGO_URI = process.env.MONGODB_URI;

//   if (!MONGO_URI) {
//     throw new Error("❌ MONGODB_URI not found in environment variables");
//   }

//   // If already connected, return cached connection
//   if (cached.conn) {
//     return cached.conn;
//   }

//   // If connection is already in progress, await it
//   if (!cached.promise) {
//     cached.promise = mongoose
//       .connect(MONGO_URI as string, {
//         bufferCommands: false,
//       })
//       .then((mongoose) => {
//         console.log("✔ MongoDB connected");
//         return mongoose;
//       })
//       .catch((err) => {
//         console.error("❌ MongoDB connection error:", err);
//         throw err;
//       });
//   }

//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// // ⬇️⬇️⬇️ ADD THIS
// export default connectDB;



import mongoose from "mongoose";

// ✅ Register models once (prevents OverwriteModelError)
import "@/models/User";
import "@/models/Booking";
import "@/models/OtherUser";
import "@/models/Banner";

// -------------------
// Global Cache Type
// -------------------
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// -------------------
// Initialize Global Cache
// -------------------
const globalWithMongoose = global as typeof global & {
  mongoose?: MongooseCache;
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

// -------------------
// Connect Function
// -------------------
async function connectDB() {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error("❌ MONGODB_URI not found in environment variables");
  }

  // ✅ Already connected
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ Create connection promise once
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false, // IMPORTANT for Turbopack
      })
      .then((mongooseInstance) => {
        console.log("✔ MongoDB connected");
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null; // 🔥 allow retry on failure
        console.error("❌ MongoDB connection error:", error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ✅ BOTH named + default export (prevents import mismatch bugs)
export { connectDB };
export default connectDB;
