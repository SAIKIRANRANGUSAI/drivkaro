"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ==============================
     SAVE ADMIN LOGIN LOG
  ============================== */
  const saveAdminLog = async () => {
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();

      const userAgent = navigator.userAgent;

      const browser =
        /Chrome/.test(userAgent)
          ? "Chrome"
          : /Firefox/.test(userAgent)
          ? "Firefox"
          : /Safari/.test(userAgent)
          ? "Safari"
          : /Edge/.test(userAgent)
          ? "Edge"
          : "Other";

      const os =
        /Windows NT/.test(userAgent)
          ? "Windows"
          : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Android/.test(userAgent)
          ? "Android"
          : /iPhone|iPad|iPod/.test(userAgent)
          ? "iOS"
          : /Linux/.test(userAgent)
          ? "Linux"
          : "Other";

      await fetch("/api/admin/settings/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: ipData.ip || "Unknown",
          browser,
          os,
          time: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to save admin log:", error);
    }
  };

  /* ==============================
     LOGIN HANDLER
  ============================== */
  const handleLogin = async () => {
    if (!email || !password) {
      setErr("Email and password are required");
      return;
    }

    setErr("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.message || "Login failed");
        setIsLoading(false);
        return;
      }

      /* 🔐 SAVE JWT TOKEN (IMPORTANT) */
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminEmail", data.admin.email);
      localStorage.setItem("adminRole", data.admin.role);
      localStorage.setItem("adminId", data.admin._id);


      /* 📝 SAVE LOGIN LOG */
      await saveAdminLog();

      /* 🚀 REDIRECT */
      router.push("/admin");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-gray-700/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/50">

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-blue-500/80 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mt-5 tracking-tight">
            Admin Access
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            Secure login to the administrative panel
          </p>
        </div>

        {/* EMAIL */}
        <div className="mb-6">
          <label className="text-gray-300 text-sm font-medium mb-2 block">
            Email Address
          </label>
          <div className="flex items-center bg-gray-700/50 rounded-xl px-5 py-3 focus-within:border-blue-500 transition">
            <Mail className="text-blue-400 mr-3" size={20} />
            <input
              type="email"
              className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="mb-8">
          <label className="text-gray-300 text-sm font-medium mb-2 block">
            Password
          </label>
          <div className="flex items-center bg-gray-700/50 rounded-xl px-5 py-3 focus-within:border-blue-500 transition">
            <Lock className="text-blue-400 mr-3" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {err && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-xl text-center mb-6 text-sm font-medium">
            {err}
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            isLoading
              ? "bg-blue-600/70 cursor-not-allowed flex items-center justify-center"
              : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/40"
          } text-white`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logging in...
            </>
          ) : (
            "Authenticate"
          )}
        </button>

      </div>
    </div>
  );
}
