import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";

export async function GET() {
  await dbConnect();

  const db = mongoose.connection.db;
  if (!db) {
    return NextResponse.json(
      { success: false, message: "Database connection not ready" },
      { status: 500 }
    );
  }

  const collections = await db.listCollections().toArray();
  const data: any = {};

  for (const col of collections) {
    const name = col.name;
    data[name] = await db.collection(name).find().toArray();
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=db.json",
    },
  });
}
