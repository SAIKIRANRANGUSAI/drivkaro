import dbConnect from "@/lib/mongoose";
import Booking from "@/models/Booking";
import Link from "next/link";
import {
  Car,
  Eye,
  CalendarDays,
  User as UserIcon,
  Search,
} from "lucide-react";

export default async function BookingsList() {
  await dbConnect();
  const bookings = await Booking.find().sort({ createdAt: -1 });

  const statusColors: any = {
    completed: "bg-green-100 text-green-700",
    ongoing: "bg-purple-100 text-purple-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    upcoming: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-8 space-y-10">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#0C1F4B] flex items-center gap-2">
          <Car /> Bookings
        </h1>

        {/* SEARCH */}
        {/* <div className="relative w-80">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            placeholder="Search booking ID..."
            className="w-full pl-9 pr-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div> */}
      </div>

      {/* TABLE WRAPPER */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <table className="w-full text-sm">
          {/* HEAD */}
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left py-3 px-5">Booking</th>
              <th className="text-left py-3 px-5">Customer</th>
              <th className="text-left py-3 px-5">Instructor</th>
              <th className="text-left py-3 px-5">Status</th>
              <th className="text-left py-3 px-5">Days</th>
              <th className="text-right py-3 px-5">Actions</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {bookings.map((b: any) => {
              const color = statusColors[b.status] || "bg-gray-100 text-gray-700";
              const date = new Date(b.createdAt).toLocaleDateString();

              return (
                <tr
                  key={b._id}
                  className="border-b hover:bg-gray-50 transition-all"
                >
                  {/* BOOKING ID */}
                  <td className="py-3 px-5">
                    <div className="font-semibold text-[#0C1F4B]">
                      {b.bookingId}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <CalendarDays size={14} /> {date}
                    </p>
                  </td>

                  {/* CUSTOMER */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <UserIcon size={16} className="text-gray-400" />
                      <span>
                        {b.userType === "user"
                          ? b.customerName
                          : b.otherUserName}
                      </span>
                    </div>
                  </td>

                  {/* INSTRUCTOR */}
                  <td className="py-3 px-5">
                    {b.assignedInstructorId ? (
                      <Link
                        href={`/admin/drivers/${b.assignedInstructorId}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                      >
                        View Instructor
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">Not Assigned</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="py-3 px-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${color}`}
                    >
                      {b.status}
                    </span>
                  </td>

                  {/* DAYS */}
                  <td className="py-3 px-5 font-medium">
                    {b.daysCount}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3 px-5 text-right">
                    <Link
                      href={`/admin/bookings/${b._id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {bookings.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No bookings found
          </div>
        )}
      </div>
    </div>
  );
}
