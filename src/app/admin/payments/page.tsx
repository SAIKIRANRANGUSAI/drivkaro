"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load payments", "error");
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter((p: any) => {
    const matchSearch =
      p.bookingId?.bookingId?.toLowerCase().includes(search.toLowerCase()) ||
      p.userId?.name?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === "ALL" || p.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-6 text-gray-800">💳 Payments</h1>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search by booking id or user..."
            className="bg-white shadow"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select onValueChange={setStatusFilter} defaultValue="ALL">
            <SelectTrigger className="bg-white shadow w-[200px]">
              {statusFilter}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ALL</SelectItem>
              <SelectItem value="CREATED">CREATED</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PAYMENT TABLE */}
        <Card className="shadow-xl border border-gray-200 rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="font-semibold text-lg">Payments Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="p-3 text-left text-sm font-semibold">Booking</th>
                      <th className="p-3 text-left text-sm font-semibold">User</th>
                      <th className="p-3 text-left text-sm font-semibold">Amount</th>
                      <th className="p-3 text-left text-sm font-semibold">Wallet Used</th>
                      <th className="p-3 text-left text-sm font-semibold">Status</th>
                      <th className="p-3 text-left text-sm font-semibold">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPayments.map((p: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b hover:bg-gray-50 transition cursor-pointer"
                      >
                        <td className="p-3">{p.bookingId?.bookingId}</td>
                        <td className="p-3">{p.userId?.name || "N/A"}</td>
                        <td className="p-3 font-medium text-green-600">₹{p.amount}</td>
                        <td className="p-3">₹{p.walletUsed}</td>

                        <td className="p-3">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full
                              ${
                                p.status === "SUCCESS"
                                  ? "bg-green-100 text-green-700"
                                  : p.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : p.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-200 text-gray-700"
                              }
                            `}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="p-3 text-sm text-gray-600">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <p className="text-center py-6 text-gray-500">
                    No payments found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
