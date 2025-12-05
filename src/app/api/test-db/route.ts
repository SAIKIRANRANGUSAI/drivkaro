import dbConnect from "@/lib/mongodb";

export async function GET() {
  console.log("ENV LOADED =>", process.env.MONGO_URI); // DEBUG

  try {
    await dbConnect();
    return Response.json({
      success: true,
      message: "MongoDB Connected Successfully 🚀",
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
