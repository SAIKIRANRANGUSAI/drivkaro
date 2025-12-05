// src/utils/authMiddleware.ts
import { verifyAccessToken } from "@/lib/jwt";

export function getUserFromAuthHeader(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    return payload; // contains userId, etc.
  } catch (err) {
    return null;
  }
}
