"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const phone = params.get("phone") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    if (!phone) {
      router.push("/auth/login");
    }
  }, [phone, router]);

  const submit = async () => {
    setError(null);
    if (!otp || otp.length < 4) {
      setError("Enter OTP");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (data.success && data.accessToken) {
        await auth.onLogin(data.accessToken, data.user);

        if (data.userExists === false) {
          router.push("/auth/register?phone=" + encodeURIComponent(phone));
        } else {
          router.push("/");
        }
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
        body: JSON.stringify({ phone }),
      });
    } catch {}
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h3>Enter OTP for {phone}</h3>

      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="6-digit code"
        style={{ width: "100%", padding: 12, fontSize: 16, marginTop: 12 }}
      />

      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}

      <button
        onClick={submit}
        disabled={loading}
        style={{ marginTop: 16, width: "100%", padding: 10 }}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <button
        onClick={resend}
        style={{ marginTop: 8, width: "100%", padding: 8 }}
      >
        Resend OTP
      </button>
    </div>
  );
}

export default VerifyContent;
