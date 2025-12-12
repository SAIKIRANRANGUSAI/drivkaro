"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash } from "lucide-react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    amount: "",
    isPercent: false,
    minAmount: "",
    maxDiscount: "",
    from: "",
    to: "",
  });

  const fetchCoupons = async () => {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    if (data.success) setCoupons(data.coupons);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createCoupon = async () => {
    if (!form.code || !form.amount || !form.from || !form.to) {
      return Swal.fire("Missing Fields", "Fill all fields!", "warning");
    }

    setLoading(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      Swal.fire({
        title: "Coupon Created 🎉",
        text: `${form.code} is now active`,
        icon: "success",
      });

      setForm({
        code: "",
        amount: "",
        isPercent: false,
        minAmount: "",
        maxDiscount: "",
        from: "",
        to: "",
      });

      fetchCoupons();
    } else {
      Swal.fire("Error", data.message || "Failed to create coupon", "error");
    }
  };

  const deleteCoupon = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This coupon will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c._id !== id));

    Swal.fire("Deleted!", "Coupon removed successfully.", "success");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎟 Manage Coupons</h1>

      {/* Create Coupon Form */}
      <Card className="mb-8 shadow-xl border rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">➕ Create New Coupon</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <Input
            placeholder="Coupon Code (e.g., WELCOME10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />

          <Input
            placeholder="Discount Amount"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Percentage Discount?</label>
            <input
              type="checkbox"
              checked={form.isPercent}
              onChange={(e) =>
                setForm({ ...form, isPercent: e.target.checked })
              }
            />
          </div>

          <Input
            placeholder="Min Order Amount"
            type="number"
            value={form.minAmount}
            onChange={(e) =>
              setForm({ ...form, minAmount: e.target.value })
            }
          />

          <Input
            placeholder="Maximum Allowed Discount"
            type="number"
            value={form.maxDiscount}
            onChange={(e) =>
              setForm({ ...form, maxDiscount: e.target.value })
            }
          />

          <div className="flex gap-4">
            <Input
              type="date"
              value={form.from}
              onChange={(e) => setForm({ ...form, from: e.target.value })}
            />
            <Input
              type="date"
              value={form.to}
              onChange={(e) => setForm({ ...form, to: e.target.value })}
            />
          </div>

          <Button
            className="w-full py-3 text-lg"
            onClick={createCoupon}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "Create Coupon"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Coupon List */}
      <h2 className="text-2xl font-semibold mb-4">All Coupons</h2>

      {coupons.length === 0 && (
        <p className="text-gray-500">No coupons created yet.</p>
      )}

      <div className="space-y-4">
        {coupons.map((c) => (
          <Card
            key={c._id}
            className="p-5 shadow hover:shadow-2xl transition rounded-xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold">{c.code}</p>
                <p className="text-gray-600">
                  {c.isPercent
                    ? `${c.amount}% Off`
                    : `₹${c.amount} Flat Off`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Valid: {new Date(c.from).toLocaleDateString()} →{" "}
                  {new Date(c.to).toLocaleDateString()}
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={() => deleteCoupon(c._id)}
              >
                <Trash />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
