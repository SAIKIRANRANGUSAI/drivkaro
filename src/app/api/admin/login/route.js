import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Admin from "@/models/Admin";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();

    const admin = await Admin.findOne({ email }).exec();
    if (!admin) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (admin.password !== password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ message: "OK" });

    res.headers.set(
      "Set-Cookie",
      `admin_token=${admin._id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
