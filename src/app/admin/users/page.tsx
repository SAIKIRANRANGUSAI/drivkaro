import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Link from "next/link";
import { Phone, MapPin, Eye } from "lucide-react";

export default async function UsersPage() {
  await dbConnect();

  const users = await User.find().sort({ createdAt: -1 });

  // FETCH LATEST BOOKING FOR EACH USER
  const userData = await Promise.all(
    users.map(async (u: any) => {
      const latestBooking = await Booking.findOne({
        userId: u._id,
      }).sort({ createdAt: -1 });

      return {
        ...u._doc,
        latestLocation: latestBooking?.pickupLocation?.name || "-",
      };
    })
  );

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[#0C1F4B] to-[#4C6EFF] bg-clip-text text-transparent">
          Users
        </h1>

        <span className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-full">
          Total: {users.length}
        </span>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {userData.map((u: any) => (
          <Link
            key={u._id}
            href={`/admin/users/${u._id}`}
            className="group bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {/* AVATAR + NAME */}
            <div className="flex items-center gap-4 mb-3">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  u.fullName || "User"
                )}&background=0C1F4B&color=fff`}
                className="w-12 h-12 rounded-full shadow-md border"
              />
              <h2 className="text-lg font-semibold text-[#0C1F4B]">
                {u.fullName || "Unknown User"}
              </h2>
            </div>

            {/* INFO */}
            <div className="space-y-2 text-gray-600 text-sm">
              <p className="flex items-center gap-2">
                <Phone size={16} />
                {u.mobile || "-"}
              </p>

              {/* LAST LOCATION FROM BOOKINGS */}
              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {u.latestLocation}
              </p>
            </div>

            {/* VIEW BUTTON */}
            <div className="mt-6 flex justify-end">
              <button className="flex items-center gap-2 text-[#0C1F4B] font-medium group-hover:underline">
                View Details <Eye size={18} />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
