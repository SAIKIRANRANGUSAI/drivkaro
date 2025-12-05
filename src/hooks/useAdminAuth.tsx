// src/hooks/useAdminAuth.tsx
"use client";
import { useCallback, useEffect, useState } from "react";

export function useAdminAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try { return typeof window !== "undefined" ? localStorage.getItem("drivkaro_admin_access") : null; } catch { return null; }
  });
  const [admin, setAdmin] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const saveToken = useCallback((t: string | null) => {
    setAccessToken(t);
    try {
      if (t) localStorage.setItem("drivkaro_admin_access", t);
      else localStorage.removeItem("drivkaro_admin_access");
    } catch {}
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.success) {
      saveToken(data.accessToken);
      setAdmin(data.admin);
      return { success: true, admin: data.admin };
    }
    return { success: false, message: data.message };
  }, [saveToken]);

  const logout = useCallback(async () => {
    try { await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); } catch {}
    saveToken(null);
    setAdmin(null);
  }, [saveToken]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/refresh-token", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (data.success) {
        saveToken(data.accessToken);
        setAdmin(data.admin ?? null);
        return data.accessToken;
      }
    } catch {}
    saveToken(null);
    setAdmin(null);
    return null;
  }, [saveToken]);

  useEffect(() => {
    (async () => {
      if (!accessToken) {
        await refresh();
      } else {
        // optionally fetch admin profile endpoint if you implement one
      }
      setLoading(false);
    })();
  }, []);

  return { accessToken, admin, loading, login, logout, refresh, saveToken };
}
