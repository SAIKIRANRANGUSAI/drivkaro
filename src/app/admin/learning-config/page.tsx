"use client";

import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { RefreshCw } from "lucide-react";

export default function AdminLearningConfigPage() {
  const [loading, setLoading] = useState(true);

  const [perDayKmLimit, setPerDayKmLimit] = useState(10);
  const [totalLearningKm, setTotalLearningKm] = useState(40);
  const [selectableDays, setSelectableDays] = useState("4,8,12");

  // ✅ AUTO-CALCULATED DAYS (THIS WAS YOUR MISSING PART)
  const totalLearningDays = useMemo(() => {
    if (!perDayKmLimit || !totalLearningKm) return 0;
    return Math.ceil(totalLearningKm / perDayKmLimit);
  }, [perDayKmLimit, totalLearningKm]);

  // ================= FETCH =================
  async function fetchConfig() {
    try {
      setLoading(true);
      const res = await fetch("/api/learning-config");
      const json = await res.json();

      if (json.success) {
        setPerDayKmLimit(json.data.perDayKmLimit);
        setTotalLearningKm(json.data.totalLearningKm);
        setSelectableDays(json.data.selectableDays.join(","));
      }
    } catch {
      Swal.fire("Error", "Failed to load config", "error");
    } finally {
      setLoading(false);
    }
  }

  // ================= SAVE =================
  async function saveConfig() {
    const res = await fetch("/api/admin/learning-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        perDayKmLimit,
        totalLearningKm,
        selectableDays: selectableDays
          .split(",")
          .map(n => Number(n.trim()))
          .filter(Boolean),
      }),
    });

    const json = await res.json();

    if (json.success) {
      Swal.fire("Saved", "Learning config updated successfully", "success");
    } else {
      Swal.fire("Error", "Update failed", "error");
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  // ================= LOADING =================
  if (loading) {
    return (
      <AdminPageWrapper
        title="Learning Configuration"
        description="Manage learning rules"
      >
        <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
      </AdminPageWrapper>
    );
  }

  // ================= UI =================
  return (
    <AdminPageWrapper
      title="Learning Configuration"
      description="Manage per-day limits, total learning & selectable days"
    >
      <div className="bg-white rounded-xl shadow p-6 space-y-6 max-w-xl">
        {/* PER DAY KM */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Per Day KM Limit
          </label>
          <input
            type="number"
            value={perDayKmLimit}
            onChange={e => setPerDayKmLimit(Number(e.target.value))}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* TOTAL KM */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Learning KM
          </label>
          <input
            type="number"
            value={totalLearningKm}
            onChange={e => setTotalLearningKm(Number(e.target.value))}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>

        {/* ✅ PREVIEW (MATCHES IMAGE EXACTLY) */}
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-sm text-gray-600">Preview (App View)</p>

          <p className="mt-2 font-medium">
            Per day limit: <b>{perDayKmLimit} km</b>
          </p>

          <p className="mt-1 text-gray-700">
            Total learning requirement
            <br />
            <span className="text-sm text-gray-500">
              ({totalLearningKm} km → {totalLearningDays} days)
            </span>
          </p>
        </div>

        {/* SELECTABLE DAYS */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Selectable Learning Days (comma separated)
          </label>
          <input
            type="text"
            value={selectableDays}
            onChange={e => setSelectableDays(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
            placeholder="4,8,12"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example shown in app: {selectableDays.replace(/,/g, " / ")} days
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Save
          </button>

          <button
            onClick={fetchConfig}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
