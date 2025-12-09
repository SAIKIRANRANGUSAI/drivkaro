"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, Loader2 } from "lucide-react"; // Added Loader2 for loading state

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleLogin = async () => {
    setErr("");
    setIsLoading(true); // Start loading

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErr(data?.message || "Login failed");
        setIsLoading(false); // Stop loading on error
        return;
      }

      // Login successful
      router.push("/admin");
    } catch {
      setErr("Network error");
      setIsLoading(false); // Stop loading on network error
    }
  };

  return (
    // 💡 Updated background colors for a richer look
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      
      {/* Outer Card - More defined appearance and shadow */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-gray-700/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/50 transition-all duration-500 hover:shadow-xl">
        
        {/* Logo / Header */}
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

        {/* Email */}
        <div className="mb-6">
          <label className="text-gray-300 text-sm font-medium mb-2 block">
            Email Address
          </label>
          {/* 💡 Input styling with clear focus and hover effect */}
          <div className="flex items-center bg-gray-700/50 rounded-xl px-5 py-3 border border-transparent focus-within:border-blue-500 transition duration-300">
            <Mail className="text-blue-400 mr-3 flex-shrink-0" size={20} />
            <input
              type="email"
              className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500 text-base"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-8">
          <label className="text-gray-300 text-sm font-medium mb-2 block">
            Password
          </label>
          <div className="flex items-center bg-gray-700/50 rounded-xl px-5 py-3 border border-transparent focus-within:border-blue-500 transition duration-300">
            <Lock className="text-blue-400 mr-3 flex-shrink-0" size={20} />
            <input
              type="password"
              className="bg-transparent text-white w-full focus:outline-none placeholder-gray-500 text-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {/* 💡 Enhanced Error Styling: Non-pulsing but clearly visible */}
        {err && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-xl text-center mb-6 text-sm font-medium">
            {err}
          </div>
        )}

        {/* Login Button */}
        {/* 💡 Added loading state (Spinner and disabled) */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition duration-300 ${
            isLoading
              ? "bg-blue-600/70 text-white cursor-not-allowed flex items-center justify-center"
              : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/40"
          }`}
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