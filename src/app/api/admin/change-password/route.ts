import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Admin from "@/models/Admin";

export async function POST(req: Request) {
  try {
    const { adminId, oldPassword, newPassword } = await req.json();

    if (!adminId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json(
        { message: "Admin not found" },
        { status: 404 }
      );
    }

    const isMatch = await admin.comparePassword(oldPassword);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Old password is incorrect" },
        { status: 401 }
      );
    }

    // password will be hashed by pre-save hook
    admin.password = newPassword;
    await admin.save();

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
