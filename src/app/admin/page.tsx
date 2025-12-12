"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Users,
  Car,
  CalendarCheck2,
  IndianRupee,
  ShieldCheck,
  ArrowRight,
  Star,
  ChevronRight,
  Loader2,
  TrendingUp,
  Users as UsersIcon,
  MapPin,
  DollarSign,
} from "lucide-react";

/* ---------------- TYPES ---------------- */
interface DashboardCardProps {
  title: string;
  value: number | string;
  change?: number; // Optional percentage change
  icon: React.ReactNode;
  color: "blue" | "orange" | "purple" | "green";
  link: string;
}

interface ActionButtonProps {
  label: string;
  link: string;
  icon: React.ReactNode;
}

/* ---------------- MAIN DASHBOARD ---------------- */
export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    drivers: 0,
    bookings: 0,
    pendingDrivers: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("/api/admin/dashboard-stats");
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#0C1F4B]" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={loadStats}
            className="px-6 py-2 bg-[#0C1F4B] text-white rounded-xl hover:bg-[#142A5C] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* MAIN AREA */}
      <div className="flex flex-col w-full">
        {/* PAGE CONTENT */}
        <main className="p-6 lg:p-8 space-y-10">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#0C1F4B] tracking-tight">
                Welcome Back, Admin 👋
              </h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your platform today.</p>
            </div>
            <Link
              href="/admin/notifications"
              className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-[#0C1F4B] to-[#142A5C] text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <TrendingUp size={18} />
              Send Notification
            </Link>
          </motion.div>

          {/* KPI CARDS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <DashboardCard
              title="Total Users"
              value={stats.users.toLocaleString()}
              change={12.5}
              icon={<Users size={28} />}
              color="blue"
              link="/admin/users"
            />
            <DashboardCard
              title="Total Instructors"
              value={stats.drivers.toLocaleString()}
              change={8.2}
              icon={<Car size={28} />}
              color="orange"
              link="/admin/drivers"
            />
            <DashboardCard
              title="Total Bookings"
              value={stats.bookings.toLocaleString()}
              change={-3.1}
              icon={<CalendarCheck2 size={28} />}
              color="purple"
              link="/admin/bookings"
            />
            <DashboardCard
              title="Revenue"
              value={`₹${stats.revenue.toLocaleString()}`}
              change={15.7}
              icon={<IndianRupee size={28} />}
              color="green"
              link="/admin/payments"
            />
          </motion.div>

          {/* GRID SECTION */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Pending Drivers */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 space-y-6 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Pending Driver Verifications
                </h3>
                <ShieldCheck size={24} className="text-yellow-600" />
              </div>
              <Link
                href="/admin/drivers/verification"
                className="block p-5 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 hover:bg-yellow-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <ShieldCheck size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Pending Verification</p>
                      <p className="text-sm text-gray-600">Approve driver documents</p>
                    </div>
                  </div>
                  <span className="font-bold text-2xl text-yellow-700 flex items-center gap-1">
                    {stats.pendingDrivers}
                    <ArrowRight size={16} className="text-yellow-600" />
                  </span>
                </div>
              </Link>
            </div>

            {/* Top Drivers */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Top Rated Drivers</h3>
                <Star size={20} className="text-yellow-500" />
              </div>
              <Link
                href="/admin/drivers"
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:bg-gray-100 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Star size={18} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">View All Drivers</p>
                    <p className="text-sm text-gray-600">Ratings & performance summary</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </Link>
            </div>

            {/* Referrals - FIXED ALIGNMENT */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Referral & Wallet Stats</h3>
                <DollarSign size={20} className="text-green-600" />
              </div>
              <Link
                href="/admin/wallet"
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:bg-blue-200 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4"> {/* Added flex-1 and pr-4 for consistent spacing */}
                    <p className="font-semibold text-gray-800 mb-1 leading-tight">Manage Wallets</p>
                    <p className="text-sm text-gray-600 leading-relaxed">Track referrals and balances</p>
                  </div>
                  <ArrowRight size={20} className="text-blue-700 flex-shrink-0 ml-2" /> {/* Reduced size to 20 for consistency, added flex-shrink-0 and ml-2 */}
                </div>
              </Link>
            </div>
          </motion.div>

          {/* QUICK ACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 lg:p-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <ActionButton
                label="Verify Drivers"
                link="/admin/drivers/verification"
                icon={<ShieldCheck size={20} className="text-yellow-600" />}
              />
              <ActionButton
                label="View Bookings"
                link="/admin/bookings"
                icon={<CalendarCheck2 size={20} className="text-purple-600" />}
              />
              <ActionButton
                label="Create Coupon"
                link="/admin/coupons"
                icon={<IndianRupee size={20} className="text-green-600" />}
              />
              <ActionButton
                label="Send Notification"
                link="/admin/notifications"
                icon={<UsersIcon size={20} className="text-blue-600" />}
              />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */
function DashboardCard({ title, value, change, icon, color, link }: DashboardCardProps) {
  const colorMap = {
    blue: { bg: "bg-blue-100", text: "text-blue-700", changeBg: "bg-blue-500" },
    orange: { bg: "bg-orange-100", text: "text-orange-700", changeBg: "bg-orange-500" },
    purple: { bg: "bg-purple-100", text: "text-purple-700", changeBg: "bg-purple-500" },
    green: { bg: "bg-green-100", text: "text-green-700", changeBg: "bg-green-500" },
  };
  const colors = colorMap[color];
  const isPositive = change && change >= 0;

  return (
    <Link href={link}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="group bg-white rounded-2xl shadow-md border border-gray-200/50 p-6 transition-all duration-300 hover:shadow-xl hover:border-gray-300/50 relative overflow-hidden"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors.bg} group-hover:shadow-lg transition-shadow`}>
              {icon}
            </div>
            <div>
              <p className="text-gray-600 text-sm font-medium">{title}</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">{value}</h2>
            </div>
          </div>
          {change !== undefined && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              isPositive ? `bg-green-100 text-green-700` : `bg-red-100 text-red-700`
            }`}>
              <span>{change}%</span>
              {isPositive ? (
                <TrendingUp size={12} className="text-green-600" />
              ) : (
                <TrendingUp size={12} className="text-red-600 rotate-180" />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function ActionButton({ label, link, icon }: ActionButtonProps) {
  return (
    <Link
      href={link}
      className="group flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:from-[#0C1F4B]/5 hover:to-[#142A5C]/5 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
    >
      <div className="p-3 bg-gradient-to-r from-[#0C1F4B] to-[#142A5C] rounded-lg mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
    </Link>
  );
}