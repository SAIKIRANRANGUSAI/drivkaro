"use client";

import { useState, ReactNode, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "@/components/AdminFooter";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-[#F5F7FA] to-[#E2E8F0] min-h-screen relative">
      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isOpen ? "open" : "closed"}
          initial={{ width: isOpen ? "280px" : "80px" }}
          animate={{ width: isOpen ? "280px" : "80px" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-gray-200/50"
        >
          <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        </motion.div>
      </AnimatePresence>

      {/* OVERLAY FOR MOBILE */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* MAIN SECTION */}
      <div
        className={`flex-1 transition-all duration-300 relative z-10 ${
          isOpen ? "pl-72 lg:pl-72" : "pl-20"
        } ${isMobile && isOpen ? "pl-0" : ""}`}
      >
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AdminHeader isOpen={isOpen} setIsOpen={toggleSidebar} />
        </motion.div>

        {/* PAGE CONTENT */}
        <main className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>

        <AdminFooter />
      </div>
    </div>
  );
}