"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "@/components/AdminFooter";

import {
  Users,
  Car,
  CalendarCheck2,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  Star,
  ChevronRight,
} from "lucide-react";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="flex">
      
      {/* SIDEBAR */}
      {/* <AdminSidebar /> */}

      {/* MAIN AREA */}
      <div className="flex flex-col w-full">

        {/* HEADER */}
        {/* <AdminHeader /> */}

        {/* PAGE CONTENT */}
        <main className="p-8 space-y-10">

          {/* TOP WELCOME AREA */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-[#0C1F4B]">
              Welcome Back, Admin 👋
            </h1>

            <Link
              href="/admin/notifications"
              className="text-sm bg-[#0C1F4B] text-white px-5 py-2 rounded-md shadow hover:bg-[#142A5C] transition"
            >
              Send Notification
            </Link>
          </div>

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <DashboardCard
              title="Total Users"
              value="0"
              icon={<Users size={28} />}
              color="blue"
              link="/admin/users"
            />

            <DashboardCard
              title="Total Drivers"
              value="0"
              icon={<Car size={28} />}
              color="orange"
              link="/admin/drivers"
            />

            <DashboardCard
              title="Total Bookings"
              value="0"
              icon={<CalendarCheck2 size={28} />}
              color="purple"
              link="/admin/bookings"
            />

            <DashboardCard
              title="Revenue"
              value="₹0"
              icon={<IndianRupee size={28} />}
              color="green"
              link="/admin/payments"
            />

          </div>

          {/* GRID SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Pending Drivers */}
            <div className="bg-white rounded-2xl shadow border p-6 space-y-4">
              <h3 className="text-xl font-semibold">Pending Driver Verifications</h3>

              <Link
                href="/admin/drivers/verification"
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-yellow-50 transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={26} className="text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-700">Pending Drivers</p>
                    <p className="text-sm text-gray-500">Approve submitted documents</p>
                  </div>
                </div>
                <span className="font-bold text-xl">0</span>
              </Link>
            </div>

            {/* Top Drivers */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-xl font-semibold mb-4">Top Rated Drivers</h3>

              <Link
                href="/admin/drivers"
                className="flex justify-between items-center p-3 border-b hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Star className="text-yellow-500" />
                  <div>
                    <p className="font-semibold text-gray-700">No Data</p>
                    <p className="text-sm text-gray-500">Ratings summary</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" />
              </Link>
            </div>

            {/* Referrals */}
            <div className="bg-white rounded-2xl shadow border p-6">
              <h3 className="text-xl font-semibold mb-4">User Referral Stats</h3>

              <div className="p-4 bg-blue-50 rounded-lg border flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-700">Total Referrals</p>
                  <h2 className="text-3xl font-bold">0</h2>
                </div>
                <ArrowRight size={28} className="text-blue-700" />
              </div>
            </div>

          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl shadow border p-6 mt-6">
            <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ActionButton label="Verify Drivers" link="/admin/drivers/verification" />
              <ActionButton label="View Bookings" link="/admin/bookings" />
              <ActionButton label="Create Coupon" link="/admin/coupons" />
              <ActionButton label="Send Notification" link="/admin/notifications" />
            </div>
          </div>

        </main>

        {/* FOOTER */}
        {/* <AdminFooter /> */}
      </div>
    </div>
  );
}

/* ----------------- REUSABLE COMPONENTS ------------------ */

function DashboardCard({ title, value, icon, color, link }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <Link href={link} className="group">
      <div className="bg-white/70 backdrop-blur-xl border shadow-md rounded-2xl p-6 transition hover:shadow-xl hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colorMap[color]}`}>
            {icon}
          </div>

          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActionButton({ label, link }) {
  return (
    <Link
      href={link}
      className="text-center bg-[#0C1F4B] text-white py-3 rounded-xl shadow hover:bg-[#142A5C] transition"
    >
      {label}
    </Link>
  );
}
