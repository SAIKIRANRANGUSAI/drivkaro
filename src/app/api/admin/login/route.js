import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Admin from "@/models/Admin";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    await connectDB();

    const admin = await Admin.findOne({ email }).exec();
    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // create response
    const res = NextResponse.json({ success: true });

    // 🔥 SET COOKIE THAT THE MIDDLEWARE EXPECTS
    res.cookies.set("adminLoggedIn", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/", // VERY IMPORTANT
      maxAge: 86400,
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
