import jwt from "jsonwebtoken";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "verystrongadminsecret";

export function signAdminToken(payload: any) {
  return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: "1d" });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, ADMIN_JWT_SECRET);
}
