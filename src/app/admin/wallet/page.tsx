// src/app/admin/wallet/page.tsx
"use client";

import { useEffect, useState } from "react";

interface Txn {
  _id: string;
  user: { fullName: string; mobile: string };
  amount: number;
  type: string;
  referenceId?: string;
  remark?: string;
  createdAt: string;
}

export default function AdminWalletPage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/wallet/transactions");
        const data = await res.json();
        setTxns(data.transactions || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Wallet & Referral Transactions</h1>
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Mobile</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Ref ID</th>
              <th className="px-3 py-2 text-left">Remark</th>
              <th className="px-3 py-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t._id} className="border-t">
                <td className="px-3 py-2">{t.user?.fullName || "-"}</td>
                <td className="px-3 py-2">{t.user?.mobile}</td>
                <td
                  className={`px-3 py-2 text-right ${
                    t.amount > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </td>
                <td className="px-3 py-2">{t.type}</td>
                <td className="px-3 py-2">{t.referenceId || "-"}</td>
                <td className="px-3 py-2">{t.remark || "-"}</td>
                <td className="px-3 py-2">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
