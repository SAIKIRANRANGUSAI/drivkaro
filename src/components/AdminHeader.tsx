// "use client";
// import { Bell, ChevronDown } from "lucide-react";

// export default function AdminHeader({ isOpen }) {
//   return (
//     <header
//       className={`
//         fixed top-0 right-0 h-16 bg-white shadow-md flex items-center justify-between px-6 z-40
//         transition-all duration-300
//         ${isOpen ? "left-72" : "left-20"}
//       `}
//     >
//       <h1 className="text-xl font-semibold text-[#0C1F4B]">Admin Dashboard</h1>

//       <div className="flex items-center gap-6">
//         <Bell size={20} className="text-gray-700" />

//         {/* Profile */}
//         <div className="flex items-center gap-2 cursor-pointer">
//           <img
//             src="https://ui-avatars.com/api/?name=Admin&background=0C1F4B&color=fff"
//             className="w-9 h-9 rounded-full"
//           />
//           <div className="text-sm font-semibold">Admin</div>
//           <ChevronDown size={18} />
//         </div>
//       </div>
//     </header>
//   );
// }
"use client";
import { Bell, ChevronDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface AdminHeaderProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AdminHeader({ isOpen, setIsOpen }: AdminHeaderProps) {
  return (
    <header
      className={`
        fixed top-0 right-0 h-16 bg-white shadow-md flex items-center justify-between px-6 z-40
        transition-all duration-300
        ${isOpen ? "left-72" : "left-20"}
      `}
    >
      <h1 className="text-xl font-semibold text-[#0C1F4B]">Admin Dashboard</h1>

      <div className="flex items-center gap-6">
        <Bell size={20} className="text-gray-700" />

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=0C1F4B&color=fff"
            className="w-9 h-9 rounded-full"
          />
          <div className="text-sm font-semibold">Admin</div>
          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  );
}
