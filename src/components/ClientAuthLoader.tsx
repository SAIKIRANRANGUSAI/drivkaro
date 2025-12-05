"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ClientAuthLoader() {
  const auth = useAuth();

  useEffect(() => {
    // Hook auto-refreshes token on mount
  }, []);

  return null;
}
