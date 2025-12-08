import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");
    const date = url.searchParams.get("date");

    if (!bookingId || !date) {
      return Response.json(
        { success: false, message: "bookingId and date are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: bookingId, date });
    }

    bookingDay.status = "missed";
    await bookingDay.save();

    return Response.json({
      success: true,
      message: "Day marked missed and extra day added",
    });
  } catch (err) {
    console.error("Missed day session error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
