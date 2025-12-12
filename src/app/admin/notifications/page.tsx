"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------------------
  // SEND NOTIFICATION
  // -----------------------------------------
  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields ⚠️",
        text: "Please enter both a title and message.",
        confirmButtonColor: "#6366F1",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Notification Sent 🎉",
          text: "Your message has been delivered to all users.",
          confirmButtonColor: "#10B981",
          timer: 1800,
        });

        setTitle("");
        setMessage("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed ❌",
          text: data.message || "Could not send notification.",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: "Unable to send notification. Try again later.",
        confirmButtonColor: "#EF4444",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6 sm:p-10 bg-gradient-to-br from-white to-gray-100">

      <div className="max-w-3xl mx-auto space-y-6">

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            🔔 Push Notifications
          </h1>
        </div>

        {/* NOTIFICATION CARD */}
        <Card className="shadow-xl border border-gray-200 rounded-2xl backdrop-blur-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Send Broadcast Notification
            </CardTitle>
            <p className="text-gray-500 text-sm">
              Instantly notify all users & instructors.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* TITLE INPUT */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <Input
                placeholder="Enter notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white shadow-sm border-gray-300 focus:ring-indigo-500"
              />
            </div>

            {/* MESSAGE INPUT */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <Textarea
                placeholder="Write the message you want to broadcast..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-white shadow-sm min-h-[140px] resize-none border-gray-300 focus:ring-indigo-500"
              />
            </div>

            {/* SEND BUTTON */}
            <Button
              onClick={sendNotification}
              disabled={loading}
              className="w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg rounded-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Sending...
                </div>
              ) : (
                "Send Notification"
              )}
            </Button>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}
