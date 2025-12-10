// src/lib/referral.ts
import crypto from "crypto";
import User from "@/models/User";
import { dbConnect } from "@/lib/mongoose";

export async function generateUniqueReferralCode(): Promise<string> {
  await dbConnect();

  // Try until unique (very fast in practice)
  while (true) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "AB12CD"
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
}
