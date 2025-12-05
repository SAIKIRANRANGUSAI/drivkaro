// src/utils/auth.ts
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export function signToken(payload: object, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
