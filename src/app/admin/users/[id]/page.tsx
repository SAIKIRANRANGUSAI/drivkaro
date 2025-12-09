import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import OtherUser from "@/models/OtherUser";
import Booking from "@/models/Booking";

import {
  User as UserIcon,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Car,
  Eye,
} from "lucide-react";

import Link from "next/link";

export default async function UserDetails(props: any) {
  // IMPORTANT FIX
  const { id } = await props.params;

  await dbConnect();

  // TRY USER → THEN OTHER USER
  let user: any = await User.findById(id);
  let userType: "user" | "other" | "unknown" = "user";

  if (!user) {
    user = await OtherUser.findById(id);
    if (user) {
      userType = "other";
    } else {
      userType = "unknown";
    }
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-red-600 font-bold text-xl">
        User Not Found
      </div>
    );
  }

  // FETCH BOOKINGS using userId OR otherUserId
  const bookings = await Booking.find({
    $or: [{ userId: id }, { otherUserId: id }],
  }).sort({ createdAt: -1 });

  // --- CITY FALLBACK LOGIC ---
  let city = user.city;

  if (!city && bookings.length > 0) {
    const latestBooking = bookings[0];
    city = latestBooking.pickupLocation?.name || "-";
  }

  return (
    <div className="p-8 space-y-10">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0C1F4B]">
            {user.fullName || user.name || "User"}
          </h1>
          <p className="text-sm text-gray-500 capitalize">
            {userType === "user" ? "Registered User" : "Other User Profile"}
          </p>
        </div>
      </div>

      {/* BASIC INFO */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <UserIcon /> Basic Info
        </h2>

        <DetailRow label="Full Name" value={user.fullName || user.name} />
        <DetailRow label="Mobile" value={user.mobile || user.phone} />
        <DetailRow label="Email" value={user.email} />

        {/* UPDATED CITY */}
        <DetailRow label="City" value={city} />

        {user.createdAt && (
          <DetailRow
            label="Joined"
            value={new Date(user.createdAt).toLocaleDateString()}
          />
        )}
      </div>

      {/* BOOKINGS */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Car /> Bookings
        </h2>

        {bookings.length === 0 && (
          <p className="text-gray-500">No bookings found for this user</p>
        )}

        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div
              key={b._id}
              className="border rounded-xl p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#0C1F4B]">
                    {b.bookingId}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/admin/bookings/${b._id}`}
                  className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                >
                  <Eye size={16} />
                  View
                </Link>
              </div>

              <p className="text-sm mt-2">
                <span className="font-medium">Status:</span>{" "}
                <span className="capitalize">{b.status}</span>
              </p>

              <p className="text-sm">
                <span className="font-medium">Days:</span> {b.daysCount} — {b.carType}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: any) {
  return (
    <p className="text-gray-700 text-sm">
      <span className="font-medium">{label}:</span> {value || "-"}
    </p>
  );
}
