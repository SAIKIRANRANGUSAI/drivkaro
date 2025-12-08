import dbConnect from "@/lib/mongoose";
import Booking from "@/models/Booking";
import BookingDay from "@/models/BookingDay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { bookingId, date } = req.query;
    const { otp } = req.body || {};

    if (!bookingId || !date || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "bookingId, date and otp are required" });
    }

    await dbConnect();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    let bookingDay = await BookingDay.findOne({ booking: bookingId, date });
    if (!bookingDay) {
      bookingDay = new BookingDay({
        booking: bookingId,
        date,
      });
    }

    bookingDay.startOtp = otp;
    bookingDay.status = "ongoing";
    bookingDay.startVerifiedAt = new Date();

    await bookingDay.save();

    return res.status(200).json({
      success: true,
      message: "Day session started",
      day: bookingDay,
    });
  } catch (err) {
    console.error("Start day session error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
