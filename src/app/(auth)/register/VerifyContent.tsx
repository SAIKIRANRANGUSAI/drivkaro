"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();

  const mobile = params.get("mobile") || params.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();

  useEffect(() => {
    if (!mobile) {
      router.push("/auth/login");
    }
  }, [mobile, router]);

  const submit = async () => {
    setError(null);

    if (!otp || otp.length < 4) {
      setError("Enter a valid OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile, otp }),
      });

      const data = await res.json();

      if (data.success && data.accessToken) {
        await auth.onLogin(data.accessToken, data.user);

        if (!data.userExists) {
          router.push(`/auth/register?mobile=${encodeURIComponent(mobile)}`);
          return;
        }

        router.push("/");
      } else {
        setError(data.message || "OTP verification failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mobile }),
      });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h2>Verify OTP</h2>
      <p style={{ marginTop: 8, color: "gray" }}>Sent to: {mobile}</p>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="Enter 6-digit OTP"
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
          fontSize: 18,
          letterSpacing: 2,
        }}
        maxLength={6}
      />

      {error && (
        <div style={{ color: "red", marginTop: 8, fontSize: 14 }}>{error}</div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 20,
          padding: 12,
          background: "black",
          color: "white",
          fontSize: 16,
        }}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <button
        onClick={resend}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 10,
          border: "1px solid black",
          background: "white",
        }}
      >
        Resend OTP
      </button>
    </div>
  );
}
