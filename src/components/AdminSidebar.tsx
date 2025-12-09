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
        bg-[#1A202C] text-gray-100 shadow-2xl z-40
        flex flex-col overflow-hidden
        transition-all duration-300
        ${isOpen ? "w-72" : "w-20"}
      `}
    >
      {/* TOP */}
      <div className="relative p-6 border-b border-gray-700/50 flex items-center justify-center">
        {isOpen ? (
          <h1 className="font-extrabold text-2xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-50 to-amber-300">
            DRIVKARO
          </h1>
        ) : (
          <span className="text-xl font-bold text-amber-300">DK</span>
        )}

        {/* COLLAPSE BTN */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-4 top-1/2 -translate-y-1/2 bg-[#2D3748] border border-gray-700 
                     p-2 rounded-full shadow-lg hover:bg-[#4A5568] transition duration-200 text-gray-300"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* SCROLL AREA */}
      <nav
        className="
        flex-1 overflow-y-auto overflow-x-hidden
        px-4 py-6 space-y-1
        custom-scroll scroll-smooth
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
        <SidebarItem icon={MapPin} title="Locations" link="/admin/locations" isOpen={isOpen} />

        <SidebarSection title="SYSTEM" isOpen={isOpen} />
        <SidebarItem icon={TicketPercent} title="Coupons" link="/admin/coupons" isOpen={isOpen} />
        <SidebarItem icon={Bell} title="Notifications" link="/admin/notifications" isOpen={isOpen} />
        <SidebarItem icon={DollarSign} title="Payments" link="/admin/payments" isOpen={isOpen} />
        <SidebarItem icon={Settings} title="Settings" link="/admin/settings" isOpen={isOpen} />
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-700/50 bg-[#151a24]">
        {isOpen ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://ui-avatars.com/api/?name=Admin&background=FFB74D&color=1A202C"
                  className="w-10 h-10 rounded-full border-2 border-amber-400"
                />
                <Mail size={12} className="absolute bottom-0 right-0 p-0.5 rounded-full bg-red-500 text-white" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-50">Super Admin</p>
                <p className="text-xs text-gray-400 truncate">admin@drivkaro.com</p>
              </div>
            </div>

            <LogoutButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src="https://ui-avatars.com/api/?name=A&background=FFB74D&color=1A202C"
                className="w-10 h-10 rounded-full border-2 border-amber-400"
              />
              <Mail size={12} className="absolute bottom-0 right-0 p-0.5 rounded-full bg-red-500 text-white" />
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
        group relative flex items-center gap-3 py-3 rounded-lg transition-all duration-200
        ${isOpen ? "px-3" : "justify-center"}
        ${isActive
          ? "bg-amber-500/10 text-amber-400 border-l-4 border-amber-500 font-semibold"
          : "text-gray-400 hover:bg-gray-700/30 hover:text-gray-50"}
      `}
    >
      <Icon size={20} />

      {/* Title */}
      <span
        className={`
          text-sm whitespace-nowrap transition-all duration-300
          ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 absolute left-full"}
        `}
      >
        {title}
      </span>

      {/* Tooltip */}
      {!isOpen && (
        <span
          className="
            absolute left-full ml-4 px-3 py-1 bg-gray-800 text-gray-200 text-xs 
            rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none
            whitespace-nowrap z-50
          "
        >
          {title}
        </span>
      )}
    </Link>
  );
}

function SidebarSection({ title, isOpen }: SidebarSectionProps) {
  return (
    <div
      className={`
        text-xs font-bold uppercase tracking-wider text-gray-500 
        transition-all duration-300
        ${isOpen ? "opacity-100 px-3 py-4" : "opacity-0 h-0 overflow-hidden"}
      `}
    >
      {title}
    </div>
  );
}

function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-700/50 transition duration-200"
    >
      <LogOut size={20} />
    </button>
  );
}
