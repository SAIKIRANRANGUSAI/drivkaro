"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    setErr("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErr(data?.message || "Login failed");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setErr("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0C1F4B] via-[#112D6A] to-[#0C1F4B] p-6">
      
      {/* Outer Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 shadow-2xl">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-white mt-4">
            Admin Panel Login
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            Secure access for administrators only
          </p>
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="text-white text-sm mb-1 block">Email</label>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-3 border border-white/30">
            <Mail className="text-white/90" size={20} />
            <input
              type="email"
              className="bg-transparent text-white w-full focus:outline-none placeholder-white/50"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="text-white text-sm mb-1 block">Password</label>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-xl px-4 py-3 border border-white/30">
            <Lock className="text-white/90" size={20} />
            <input
              type="password"
              className="bg-transparent text-white w-full focus:outline-none placeholder-white/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {err && (
          <p className="text-red-400 text-center mb-4 animate-pulse">{err}</p>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-white text-[#0C1F4B] font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition"
        >
          Login
        </button>

      </div>
    </div>
  );
}
