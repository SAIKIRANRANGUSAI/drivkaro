"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "@/components/AdminFooter";

export default function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex bg-[#F5F7FA] min-h-screen relative">

      {/* SIDEBAR */}
      <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* MAIN SECTION */}
      <div
        className={`flex-1 transition-all duration-300 
        ${isOpen ? "pl-72" : "pl-20"}`}
      >
        {/* HEADER */}
        <AdminHeader isOpen={isOpen} setIsOpen={setIsOpen} />

        {/* PAGE CONTENT */}
        <main className="pt-20 px-6">
          {children}
        </main>

        <AdminFooter />
      </div>
    </div>
  );
}
