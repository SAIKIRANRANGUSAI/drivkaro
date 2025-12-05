// src/app/api/admin/change-password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { adminId, oldPassword, newPassword } = await req.json();
    if (!adminId || !oldPassword || !newPassword) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    await connectDB();
    const admin = await Admin.findById(adminId).exec();
    if (!admin) return NextResponse.json({ message: "Admin not found" }, { status: 404 });

    const match = await admin.comparePassword(oldPassword);
    if (!match) return NextResponse.json({ message: "Old password incorrect" }, { status: 401 });

    const salt = await bcrypt.genSalt(10);
    admin.passwordHash = await bcrypt.hash(newPassword, salt);
    await admin.save();

    return NextResponse.json({ message: "Password updated" });
  } catch (err) {
    console.error("Change password error", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
