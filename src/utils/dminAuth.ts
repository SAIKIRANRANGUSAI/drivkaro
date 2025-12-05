// src/utils/adminAuth.ts
import { verifyAccessToken } from "@/lib/jwt";

export function getAdminFromHeader(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const payload = verifyAccessToken(token);
    return payload;
  } catch {
    return null;
  }
}
