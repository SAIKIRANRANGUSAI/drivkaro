"use client";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Award,
  Briefcase,
  CarFront,
  CalendarCheck,
  MapPin,
  TicketPercent,
  Bell,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Mail,
  UserCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

interface SidebarItemProps {
  icon: any;
  title: string;
  link: string;
  isOpen: boolean;
}

interface SidebarSectionProps {
  title: string;
  isOpen: boolean;
}

export default function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 shadow-2xl z-50
        flex flex-col overflow-hidden
        transition-all duration-500 ease-in-out
        ${isOpen ? "w-72" : "w-20"}
      `}
    >
      {/* TOP HEADER */}
      <div className="relative p-6 border-b border-gray-700/30 flex items-center justify-center">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-gray-900">DK</span>
            </div>
            <h1 className="font-black text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-amber-200 to-gray-300">
              DRIVKARO
            </h1>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-gray-900">DK</span>
          </div>
        )}

        {/* COLLAPSE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-700/50 border border-gray-600/50 
                     p-2.5 rounded-full shadow-xl hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-300 
                     text-gray-300 hover:text-amber-300 flex items-center justify-center"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* NAVIGATION SCROLL AREA */}
      <nav
        className="
          flex-1 overflow-y-auto overflow-x-hidden
          px-3 py-6 space-y-2
          scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800
        "
      >
        <SidebarSection title="MAIN" isOpen={isOpen} />
        <SidebarItem icon={LayoutDashboard} title="Dashboard" link="/admin" isOpen={isOpen} />

        <SidebarSection title="USER MANAGEMENT" isOpen={isOpen} />
        <SidebarItem icon={Users} title="Users" link="/admin/users" isOpen={isOpen} />
        <SidebarItem icon={Wallet} title="Wallet & Referrals" link="/admin/wallet" isOpen={isOpen} />
        <SidebarItem icon={Award} title="License Requests" link="/admin/license" isOpen={isOpen} />

        <SidebarSection title="DRIVERS" isOpen={isOpen} />
        <SidebarItem icon={CarFront} title="Drivers" link="/admin/drivers" isOpen={isOpen} />
        <SidebarItem icon={Briefcase} title="Driver Verification" link="/admin/drivers/verification" isOpen={isOpen} />

        <SidebarSection title="BOOKINGS" isOpen={isOpen} />
        <SidebarItem icon={CalendarCheck} title="Bookings" link="/admin/bookings" isOpen={isOpen} />
        {/* <SidebarItem icon={MapPin} title="Locations" link="/admin/locations" isOpen={isOpen} /> */}

        <SidebarSection title="SYSTEM" isOpen={isOpen} />
        <SidebarItem icon={TicketPercent} title="Coupons" link="/admin/coupons" isOpen={isOpen} />
        <SidebarItem icon={Bell} title="Notifications" link="/admin/notifications" isOpen={isOpen} />
        <SidebarItem icon={DollarSign} title="Payments" link="/admin/payments" isOpen={isOpen} />
        <SidebarItem icon={Settings} title="Settings" link="/admin/settings" isOpen={isOpen} />
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-700/30 bg-gray-800/50 backdrop-blur-sm">
        {isOpen ? (
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src="https://ui-avatars.com/api/?name=Admin&background=FFB74D&color=1A202C&size=40&bold=true"
                  alt="Admin Profile"
                  className="w-10 h-10 rounded-full border-2 border-amber-400/50 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <Mail size={10} className="text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-100 truncate">Super Admin</p>
                <p className="text-xs text-gray-400 truncate">admin@drivkaro.com</p>
              </div>
            </div>

            <LogoutButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src="https://ui-avatars.com/api/?name=A&background=FFB74D&color=1A202C&size=40&bold=true"
                alt="Admin Profile"
                className="w-10 h-10 rounded-full border-2 border-amber-400/50 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <Mail size={10} className="text-white" />
              </div>
            </div>

            <LogoutButton />
          </div>
        )}
      </div>
    </aside>
  );
}

/* ----------------------------------------------- */
/* COMPONENTS */
/* ----------------------------------------------- */

function SidebarItem({ icon: Icon, title, link, isOpen }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === link;

  return (
    <Link
      href={link}
      className={`
        group relative flex items-center gap-4 py-3 px-3 rounded-xl transition-all duration-300 ease-out
        overflow-hidden
        ${isActive
          ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/30 shadow-inner"
          : "text-gray-400 hover:bg-gray-700/40 hover:text-gray-200 hover:border-gray-600/50 border border-transparent"
        }
        ${!isOpen ? "justify-center p-3" : ""}
      `}
    >
      <div className={`p-2 rounded-lg transition-colors duration-300 flex-shrink-0 ${
        isActive 
          ? "bg-amber-500/10" 
          : "group-hover:bg-amber-500/10 group-hover:text-amber-300"
      }`}>
        <Icon size={20} />
      </div>

      {/* Title */}
      <span
        className={`
          text-sm font-medium whitespace-nowrap transition-all duration-500 ease-out
          ${isOpen ? "opacity-100 translate-x-0 delay-150" : "opacity-0 -translate-x-2 absolute left-full scale-95"}
        `}
      >
        {title}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full shadow-lg" />
      )}

      {/* Tooltip for collapsed state */}
      {!isOpen && (
        <div
          className="
            absolute left-full ml-4 px-3 py-2 bg-gray-800/95 backdrop-blur-sm text-gray-100 text-xs rounded-xl shadow-2xl 
            opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50
            border border-gray-700/50 transition-all duration-300 scale-95 group-hover:scale-100
          "
        >
          {title}
        </div>
      )}
    </Link>
  );
}

function SidebarSection({ title, isOpen }: SidebarSectionProps) {
  return (
    <div
      className={`
        text-xs font-bold uppercase tracking-widest text-gray-500/70 
        transition-all duration-500 ease-out mb-2
        ${isOpen ? "opacity-100 translate-y-0 delay-200 px-1 py-3" : "opacity-0 translate-y-2 h-0 overflow-hidden"}
      `}
    >
      <div className="flex items-center gap-2">
        <div className="w-1 h-1 bg-gray-500/50 rounded-full" />
        {title}
      </div>
    </div>
  );
}

function LogoutButton() {
  return (
    <button
      onClick={async () => {
        'use client';
        if (confirm("Are you sure you want to log out?")) {
          await fetch("/api/admin/logout", { method: "POST" });
          window.location.href = "/login";
        }
      }}
      className="group relative p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
      title="Logout"
    >
      <LogOut size={18} className="group-hover:rotate-180 transition-transform duration-300" />
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-100 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-50">
        Logout
      </span>
    </button>
  );
}