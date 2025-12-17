"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useState,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface AdminHeaderProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

interface LogoData {
  logoUrl: string;
}

export default function AdminHeader({
  isOpen,
  setIsOpen,
}: AdminHeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [logo, setLogo] = useState<LogoData>({ logoUrl: "" });
  const [loadingLogo, setLoadingLogo] = useState(true);

  // ✅ ref MUST be inside component
  const profileRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // Fetch Logo
  // -----------------------------
  async function fetchLogo() {
    try {
      const res = await fetch("/api/admin/logo");
      const json = await res.json();
      if (json.success) {
        setLogo(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch logo:", error);
    } finally {
      setLoadingLogo(false);
    }
  }

  useEffect(() => {
    fetchLogo();
  }, []);

  // -----------------------------
  // Close profile on outside click
  // -----------------------------
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    }

    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfile]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        left: isOpen ? "280px" : "80px",
        width: isOpen
          ? "calc(100% - 280px)"
          : "calc(100% - 80px)",
      }}
      className="
        fixed top-0 right-0 z-50 h-16
        bg-white/80 backdrop-blur-xl
        border-b border-gray-200/50
        shadow-lg
        flex items-center justify-between
        px-6 lg:px-8
        transition-all duration-300
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:flex items-center gap-3">
          {loadingLogo ? (
            <div className="w-8 h-8 rounded-lg bg-amber-400 animate-pulse flex items-center justify-center">
              DK
            </div>
          ) : logo.logoUrl ? (
            <img
              src={logo.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-lg object-contain bg-white p-1"
            />
          ) : null}

          <h1 className="text-xl font-bold text-[#0C1F4B]">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        

        {/* PROFILE */}
        <motion.div
          ref={profileRef}
          className="relative"
          whileHover={{ scale: 1.02 }}
        >
          <button
            onClick={() => setShowProfile((prev) => !prev)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100"
          >
            <img
              src="https://ui-avatars.com/api/?name=Admin&background=0C1F4B&color=fff"
              className="w-9 h-9 rounded-full border"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-[#0C1F4B]">
                Super Admin
              </p>
              <p className="text-xs text-gray-500">
                admin@drivkaro.com
              </p>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                showProfile ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border overflow-hidden"
              >
                <Link
                  href="/admin/change-password"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <User size={16} />
                  Change Password
                </Link>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <Settings size={16} />
                  Settings
                </Link>

                <hr />

                <button
                  onClick={async () => {
                    setShowProfile(false);
                    await fetch("/api/admin/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.header>
  );
}
