import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Instructor from "@/models/Instructor";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    await dbConnect();

    const users = await User.countDocuments();
    const drivers = await Instructor.countDocuments();

    const pendingDrivers = await Instructor.countDocuments({
      status: { $in: ["pending", "verification"] }
    });

    const bookings = await Booking.countDocuments();

    const revenueAgg = await Booking.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["success", "paid", "completed"] }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const revenue = revenueAgg.length ? revenueAgg[0].total : 0;

    return Response.json({
      users,
      drivers,
      pendingDrivers,
      bookings,
      revenue,
    });

  } catch (err: any) {
    console.error("Dashboard Error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
