import jwt from "jsonwebtoken";

export function getInstructorId(req: Request): string | null {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = auth.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
    return decoded?.id || null;
  } catch (err) {
    return null; // invalid / expired token
  }
}
