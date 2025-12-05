// src/app/(profile)/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, fetchProfile, accessToken } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLocalLoading(true);
      if (!user) {
        await fetchProfile(); // will attempt refresh if needed
      }
      setLocalLoading(false);
    })();
  }, []);

  if (loading || localLoading) return <div>Loading...</div>;

  if (!user) return <div>Please login</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Profile</h2>
      <div>Name: {user.name || "-"}</div>
      <div>Phone: {user.phone}</div>
      <div>Email: {user.email || "-"}</div>
    </div>
  );
}
