import dbConnect from "@/lib/mongoose";
import Instructor from "@/models/Instructor";
import Link from "next/link";
import { Eye, Phone, MapPin, CheckCircle2, Ban } from "lucide-react";

import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import SkeletonCard from "@/components/admin/SkeletonCard";

export  function UsersPage() {
  return (
    <AdminPageWrapper
      title="Users Management"
      description="View and manage registered users"
    >
      <SkeletonCard />
    </AdminPageWrapper>
  );
}

export default async function DriversPage() {
  await dbConnect();

  // SHOW approved + blocked
  const list = await Instructor.find({
    status: { $in: ["approved", "blocked"] },
  }).sort({ createdAt: -1 });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#0C1F4B]">
          Instructors
        </h1>
      </div>

      {/* GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {list.map((ins: any) => (
          <Link
            key={ins._id}
            href={`/admin/drivers/${ins._id}`}
            className="group bg-white rounded-2xl shadow border p-6 hover:shadow-xl hover:-translate-y-1 transition"
          >
            {/* NAME */}
            <h2 className="text-xl font-semibold text-[#0C1F4B] mb-2">
              {ins.fullName}
            </h2>

            {/* INFO */}
            <div className="space-y-2 text-gray-600 text-sm">
              <p className="flex items-center gap-2">
                <Phone size={16} />
                {ins.mobile}
              </p>

              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {ins.city || "-"}
              </p>
            </div>

            {/* STATUS BADGE */}
            <div className="mt-4">
              {ins.status === "approved" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                  <CheckCircle2 size={14} /> Approved
                </span>
              )}

              {ins.status === "blocked" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">
                  <Ban size={14} /> Blocked
                </span>
              )}
            </div>

            {/* VIEW BUTTON */}
            <div className="mt-6 flex justify-end">
              <button className="flex items-center gap-1 text-[#0C1F4B] font-medium group-hover:underline">
                View Details <Eye size={18} />
              </button>
            </div>
          </Link>
        ))}

        {/* If empty */}
        {list.length === 0 && (
          <p className="text-center text-gray-500 text-lg col-span-full">
            No instructors found.
          </p>
        )}
      </div>
    </div>
  );
}
