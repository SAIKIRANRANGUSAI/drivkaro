"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  Eye,
  CalendarDays,
  User as UserIcon,
  Search,
  Download,
} from "lucide-react";

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);

  // Filters
  const [searchBooking, setSearchBooking] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchInstructor, setSearchInstructor] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings);
        setFiltered(data.bookings);
      });
  }, []);

  // FILTERING LOGIC
  useEffect(() => {
    let results = bookings;

    // Booking ID search
    if (searchBooking.trim()) {
      results = results.filter((b: any) =>
        b.bookingId.toLowerCase().includes(searchBooking.toLowerCase())
      );
    }

    // Customer search by fullName
    if (searchUser.trim()) {
      results = results.filter((b: any) =>
        (b.userId?.fullName || "")
          .toLowerCase()
          .includes(searchUser.toLowerCase())
      );
    }

    // Instructor search by fullName or days[].instructorName
    if (searchInstructor.trim()) {
      const term = searchInstructor.toLowerCase();
      results = results.filter((b: any) =>
        (b.assignedInstructorId?.fullName || "").toLowerCase().includes(term) ||
        b.days.some((d: any) =>
          (d.instructorName || "").toLowerCase().includes(term)
        )
      );
    }

    // Date search
    if (searchDate.trim()) {
      results = results.filter((b: any) =>
        b.days.some((d: any) => d.date.startsWith(searchDate))
      );
    }

    setFiltered(results);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchBooking, searchUser, searchInstructor, searchDate, bookings]);

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CSV DOWNLOAD
  const downloadCSV = () => {
    const rows = [
      ["Booking ID", "Customer", "Instructor", "Status", "Date", "Days"],
      ...filtered.map((b: any) => [
        b.bookingId,
        b.userId?.fullName ?? "N/A",
        b.assignedInstructorId?.fullName ?? "Not Assigned",
        b.status,
        new Date(b.createdAt).toLocaleDateString(),
        b.daysCount,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "bookings.csv";
    link.click();
  };

  const statusColors: any = {
    completed: "bg-green-100 text-green-700",
    ongoing: "bg-purple-100 text-purple-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
    instructor_assigned: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-8 space-y-10">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0C1F4B] flex items-center gap-2">
          <Car /> Bookings
        </h1>

        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700"
        >
          <Download size={18} />
          Download CSV
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-wrap gap-4">

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input
            placeholder="Search Booking ID..."
            className="pl-9 pr-4 py-2 w-64 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500"
            value={searchBooking}
            onChange={(e) => setSearchBooking(e.target.value)}
          />
        </div>

        <input
          placeholder="Search Customer Name..."
          className="px-4 py-2 w-64 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
        />

        <input
          placeholder="Search Instructor Name..."
          className="px-4 py-2 w-64 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500"
          value={searchInstructor}
          onChange={(e) => setSearchInstructor(e.target.value)}
        />

        <input
          type="date"
          className="px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left">Booking</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Instructor</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Days</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((b: any) => {
              const color =
                statusColors[b.status] || "bg-gray-200 text-gray-700";

              return (
                <tr key={b._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">
                    <div className="font-semibold text-[#0C1F4B]">
                      {b.bookingId}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <CalendarDays size={14} />{" "}
                      {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </td>

                  {/* CUSTOMER */}
                  <td className="p-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-gray-400" />
                    {b.userId?.fullName || "N/A"}
                  </td>

                  {/* INSTRUCTOR */}
                  <td className="p-3">
                    {b.assignedInstructorId ? (
                      <Link
                        href={`/admin/drivers/${b.assignedInstructorId._id}`}
                        className="text-blue-600 underline"
                      >
                        {b.assignedInstructorId.fullName}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Not Assigned</span>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${color}`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="p-3 font-semibold">{b.daysCount}</td>

                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/bookings/${b._id}`}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg flex items-center gap-2 inline-flex"
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

        {filtered.length === 0 && (
          <p className="p-6 text-center text-gray-500">No bookings found</p>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center p-4">

        {/* Items Per Page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            className="border rounded px-2 py-1"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Prev
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages || 1}
          </span>

          {/* Next */}
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages || totalPages === 0
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
