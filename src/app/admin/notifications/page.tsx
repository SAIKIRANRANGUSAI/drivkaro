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
        title: "Missing Fields",
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
          text: "Your push notification has been delivered to all users.",
          confirmButtonColor: "#10B981",
        });

        setTitle("");
        setMessage("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
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
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-3xl mx-auto">

        {/* PAGE TITLE */}
        <h1 className="text-4xl font-bold mb-6 text-gray-800">
          🔔 Push Notifications
        </h1>

        {/* NOTIFICATION FORM */}
        <Card className="shadow-xl border border-gray-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Send Notification</CardTitle>
            <p className="text-gray-500 text-sm">
              Send instant push notifications to all users & instructors.
            </p>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* TITLE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Title</label>
              <Input
                placeholder="Enter notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white shadow-sm focus:ring-indigo-500"
              />
            </div>

            {/* MESSAGE */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Message</label>
              <Textarea
                placeholder="Enter message to broadcast..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-white shadow-sm min-h-[120px] resize-none focus:ring-indigo-500"
              />
            </div>

            {/* SEND BUTTON */}
            <Button
              onClick={sendNotification}
              disabled={loading}
              className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin h-6 w-6" />
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
