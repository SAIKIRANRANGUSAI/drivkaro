import connectDB from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");
    const date = url.searchParams.get("date");

    const { otp } = await req.json();

    if (!bookingId || !date || !otp) {
      return Response.json(
        { success: false, message: "bookingId, date and otp are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      bookingDay = new BookingDay({ booking: bookingId, date });
    }

    bookingDay.startOtp = otp;
    bookingDay.status = "ongoing";
    bookingDay.startVerifiedAt = new Date();

    await bookingDay.save();

    return Response.json({
      success: true,
      message: "Day session started",
      day: bookingDay,
    });
  } catch (err) {
    console.error("Start day session error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
