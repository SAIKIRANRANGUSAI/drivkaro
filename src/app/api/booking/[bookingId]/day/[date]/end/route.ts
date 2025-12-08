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

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return Response.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      return Response.json(
        { success: false, message: "Booking day not found" },
        { status: 404 }
      );
    }

    bookingDay.endOtp = otp;
    bookingDay.status = "completed";
    bookingDay.endVerifiedAt = new Date();

    await bookingDay.save();

    return Response.json({
      success: true,
      message: "Day session ended",
      day: bookingDay,
    });
  } catch (err) {
    console.error("End day session error:", err);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
