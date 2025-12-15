"use client";
import { Bell, ChevronDown, Search, Menu, User, Settings, LogOut } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface AdminHeaderProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AdminHeader({ isOpen, setIsOpen }: AdminHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`
         top-0 left-${isOpen ? "72" : "20"} right-0 h-16
        bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50
        flex items-center justify-between px-6 lg:px-8 z-40
        transition-all duration-300 ease-in-out
      `}
    >
      {/* Left Section: Mobile Menu + Title */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <motion.h1
          className="text-xl lg:text-2xl font-bold text-[#0C1F4B] tracking-tight hidden sm:block"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Admin Dashboard
        </motion.h1>
      </div>

      {/* Center Section: Search Bar (Optional/Collapsible) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        {/* <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0C1F4B]/20 focus:border-transparent transition-all duration-200 text-sm placeholder-gray-500"
          />
        </div> */}
      </div>

      {/* Right Section: Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 text-gray-600 hover:text-[#0C1F4B] hover:bg-gray-100 rounded-xl transition-all duration-200"
          aria-label="Notifications"
        >
          {/* <Bell size={20} /> */}
          {/* Notification Badge */}
          {/* <motion.div
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <span className="text-xs font-bold text-white">3</span>
          </motion.div> */}
        </motion.button>

        {/* Profile Dropdown */}
        <motion.div
          className="relative"
          initial={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
        >
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-700"
          >
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=0C1F4B&color=fff&size=36&bold=true"
              alt="Admin Profile"
              className="w-9 h-9 rounded-full border-2 border-gray-200 shadow-sm"
            />
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-[#0C1F4B]">Super Admin</span>
              <span className="text-xs text-gray-500">admin@drivkaro.com</span>
            </div>
            <ChevronDown size={16} className={`transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 overflow-hidden"
              >
                <div className="py-2">
                  <Link href="/admin/change-password" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User size={18} />
                    change-password
                  </Link>
                  <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings size={18} />
                    Settings
                  </Link>
                  <hr className="border-gray-200/50" />
                  <button
                    onClick={async () => {
                      await fetch("/api/admin/logout", { method: "POST" });
                      window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.header>
  );
}