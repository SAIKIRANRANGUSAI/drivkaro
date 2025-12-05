export default function AdminFooter() {
  return (
    <footer className="mt-16 pb-6 pt-6 text-center">

      {/* Top Divider Line */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />

      {/* Footer Content */}
      <div className="flex flex-col items-center gap-1 text-gray-600 text-sm">

        <span>
          © {new Date().getFullYear()} <b>DrivKaro Admin Panel</b>
        </span>

        <div className="flex items-center gap-4 text-gray-400 text-xs">
          <a
            href="#"
            className="hover:text-[#0C1F4B] transition"
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a
            href="#"
            className="hover:text-[#0C1F4B] transition"
          >
            Terms & Conditions
          </a>
          <span>•</span>
          <span className="font-medium text-gray-500">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
