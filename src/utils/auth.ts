import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export function signToken(payload: object, expiresIn = "7d") {
  return jwt.sign(
    payload,
    JWT_SECRET as Secret,
    { expiresIn } as SignOptions
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET as Secret);
  } catch (err) {
    return null;
  }
}
