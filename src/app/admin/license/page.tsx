"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, User, Car, Clock } from "lucide-react";

export default function LicensePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ------------------------------------------------
  // Fetch all license requests
  // ------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/license");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ------------------------------------------------
  // Update Status Function
  // ------------------------------------------------
  const updateStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id);

      const res = await fetch(`/api/admin/license/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      // Smooth UI update
      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, status } : req
        )
      );

      alert("Status updated successfully!");
    } catch (err) {
      console.error("Status update error:", err);
      alert("Something went wrong!");
    } finally {
      setActionLoading(null);
    }
  };

  // ------------------------------------------------
  // Status Badge Colors
  // ------------------------------------------------
  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "processing":
      case "contacted":
        return "bg-blue-600 text-white";
      case "completed":
        return "bg-green-600 text-white";
      case "rejected":
      case "not_interested":
        return "bg-red-600 text-white";
      case "ongoing":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // ------------------------------------------------
  // UI
  // ------------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Admin Dashboard</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Driving License Requests</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-600">
          Manage all driving license service requests from learners.
        </CardContent>
      </Card>

      <h2 className="text-2xl font-semibold mb-3">All Requests</h2>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin h-8 w-8 text-gray-700" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No requests found.</p>
      ) : (
        requests.map((req) => (
          <Card key={req._id} className="mb-4 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">
                Booking: <span className="font-bold">{req.bookingId}</span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={statusColor(req.status)}>{req.status}</Badge>
                {req.wantsLicense && (
                  <Badge className="bg-green-500 text-white">Wants License</Badge>
                )}
              </div>

              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock size={16} /> {new Date(req.createdAt).toLocaleString()}
              </p>

              <div className="mt-4">
                <h3 className="font-semibold">User Details:</h3>
                <p className="flex items-center gap-2 mt-1">
                  <User size={16} /> {req.userId?.fullName || "N/A"}
                </p>
                <p className="flex items-center gap-2 mt-1">
                  <Phone size={16} /> {req.userId?.mobile || "N/A"}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold">Instructor:</h3>
                <p className="flex items-center gap-2 mt-1">
                  <Car size={16} /> {req.driverId?.fullName || "N/A"}
                </p>
                <p className="flex items-center gap-2 mt-1">
                  <Phone size={16} /> {req.driverId?.mobile || "N/A"}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-5 flex flex-wrap gap-3">

                <Button
                  disabled={actionLoading === req._id}
                  onClick={() => updateStatus(req._id, "processing")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {actionLoading === req._id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Move to Processing"
                  )}
                </Button>

                <Button
                  disabled={actionLoading === req._id}
                  onClick={() => updateStatus(req._id, "completed")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading === req._id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Mark Completed"
                  )}
                </Button>

                <Button
                  disabled={actionLoading === req._id}
                  onClick={() => updateStatus(req._id, "rejected")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {actionLoading === req._id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Reject Request"
                  )}
                </Button>

              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
