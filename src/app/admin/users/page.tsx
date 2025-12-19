"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, MapPin, Search } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(12);

  useEffect(() => {
    setLoading(true);

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setFiltered(data.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // SEARCH
  useEffect(() => {
    const s = search.trim().toLowerCase();
    const result = users.filter((u: any) =>
      u.fullName?.toLowerCase().includes(s) ||
      u.mobile?.includes(s) ||
      u._id?.toLowerCase().includes(s)
    );
    setFiltered(result);
    setPage(1);
  }, [search, users]);

  const totalPages = Math.ceil(filtered.length / rows);
  const pageData = filtered.slice((page - 1) * rows, page * rows);

  /* =======================
     🔹 SKELETON UI
  ======================= */
  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        {/* Header */}
        <div className="flex justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-24 bg-gray-200 rounded-full" />
        </div>

        {/* Search */}
        <div className="h-12 w-96 bg-gray-200 rounded-xl" />

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border shadow p-6 space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-300 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-52 bg-gray-200 rounded" />
              <div className="h-4 w-24 bg-blue-200 rounded" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  /* =======================
     🔹 REAL UI
  ======================= */
  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-[#0C1F4B]">Users</h1>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
          Total: {users.length}
        </span>
      </div>

      {/* SEARCH */}
      <div className="relative w-96 mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" />
        <input
          placeholder="Search by name, mobile, user ID..."
          className="pl-10 pr-4 py-3 w-full bg-white shadow rounded-xl border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pageData.map((u: any) => (
          <Link
            key={u._id}
            href={`/admin/users/${u._id}`}
            className="group bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4 mb-3">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  u.fullName || "User"
                )}&background=0C1F4B&color=fff`}
                className="w-12 h-12 rounded-full border shadow"
              />
              <div>
                <h2 className="text-lg font-semibold text-[#0C1F4B]">
                  {u.fullName}
                </h2>
                <p className="text-xs text-gray-400">{u._id}</p>
              </div>
            </div>

            <p className="flex items-center gap-2 text-gray-600 text-sm">
              <Phone size={16} /> {u.mobile}
            </p>

            <p className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin size={16} /> {u.latestLocation || "-"}
            </p>

            <p className="mt-3 text-blue-600 font-medium group-hover:underline">
              View Details →
            </p>
          </Link>
        ))}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6 px-2">
        <div className="text-sm flex items-center gap-2">
          Rows per page:
          <select
            className="border rounded px-2 py-1"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          >
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
            <option value={18}>18</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-3 py-1 rounded ${
              page === 1 ? "bg-gray-200" : "bg-blue-600 text-white"
            }`}
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded ${
              page === totalPages
                ? "bg-gray-200"
                : "bg-blue-600 text-white"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
