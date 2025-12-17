// src/hooks/useAdminAuth.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

export function useAdminAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined"
        ? localStorage.getItem("drivkaro_admin_access")
        : null;
    } catch {
      return null;
    }
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

  // ======================
  // LOGIN
  // ======================
  const login = useCallback(
    async (email: string, password: string) => {
      Swal.fire({
        title: "Signing in",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Invalid credentials");
        }

        saveToken(data.accessToken);
        setAdmin(data.admin);

        Swal.fire({
          icon: "success",
          title: "Login successful",
          timer: 1500,
          showConfirmButton: false,
        });

        return { success: true, admin: data.admin };
      } catch (err: any) {
        Swal.fire("Login Failed", err.message, "error");
        return { success: false, message: err.message };
      }
    },
    [saveToken]
  );

  // ======================
  // LOGOUT
  // ======================
  const logout = useCallback(async () => {
    Swal.fire({
      title: "Logging out",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    saveToken(null);
    setAdmin(null);

    Swal.fire({
      icon: "success",
      title: "Logged out",
      timer: 1200,
      showConfirmButton: false,
    });
  }, [saveToken]);

  // ======================
  // REFRESH TOKEN
  // ======================
  const refresh = useCallback(async () => {
    Swal.fire({
      title: "Restoring session",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/admin/refresh-token", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        saveToken(data.accessToken);
        setAdmin(data.admin ?? null);
        Swal.close();
        return data.accessToken;
      }
    } catch {}

    Swal.close();
    saveToken(null);
    setAdmin(null);
    return null;
  }, [saveToken]);

  // ======================
  // INIT
  // ======================
  useEffect(() => {
    (async () => {
      if (!accessToken) {
        await refresh();
      }
      setLoading(false);
    })();
  }, []);

  return {
    accessToken,
    admin,
    loading,
    login,
    logout,
    refresh,
    saveToken,
  };
}
