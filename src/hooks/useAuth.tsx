// src/hooks/useAuth.tsx
"use client";
import { useCallback, useEffect, useState } from "react";

type User = {
  _id?: string;
  phone?: string;
  name?: string;
  email?: string;
};

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem("drivkaro_access") : null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const saveToken = useCallback((token: string | null) => {
    setAccessToken(token);
    try {
      if (token) localStorage.setItem("drivkaro_access", token);
      else localStorage.removeItem("drivkaro_access");
    } catch {}
  }, []);

  // call refresh-token endpoint (cookie must be sent)
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh-token", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success && data?.accessToken) {
        saveToken(data.accessToken);
        setUser(data.user || null);
        return data.accessToken;
      } else {
        saveToken(null);
        setUser(null);
        return null;
      }
    } catch (err) {
      saveToken(null);
      setUser(null);
      return null;
    }
  }, [saveToken]);

  // login flow after verify-otp; stores access token and user
  const onLogin = useCallback(async (accessTokenFromServer: string, userFromServer?: any) => {
    saveToken(accessTokenFromServer);
    if (userFromServer) setUser(userFromServer);
  }, [saveToken]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      // ignore
    }
    saveToken(null);
    setUser(null);
  }, [saveToken]);

  // fetch profile if we have token
  const fetchProfile = useCallback(async (token?: string) => {
    const t = token ?? accessToken;
    if (!t) return null;
    try {
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data?.success) {
        setUser(data.user);
        return data.user;
      } else if (data?.message === "Invalid token") {
        // try refresh
        const newToken = await refresh();
        if (newToken) return fetchProfile(newToken);
      }
    } catch (err) {
      // ignore
    }
    return null;
  }, [accessToken, refresh]);

  useEffect(() => {
    // on mount try refresh (this will use HttpOnly cookie if present)
    let mounted = true;
    (async () => {
      setLoading(true);
      if (!accessToken) {
        await refresh();
      } else {
        // we have token: fetch profile
        await fetchProfile(accessToken);
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []); // run once on mount

  return {
    accessToken,
    user,
    loading,
    onLogin,
    logout,
    refresh,
    fetchProfile,
    saveToken,
  };
}
