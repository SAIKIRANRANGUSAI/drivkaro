import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// Generate Access Token (short expiry)
export function signAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

// Generate Refresh Token (long expiry)
export function signRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

// Verify Access Token
export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Verify Refresh Token
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
