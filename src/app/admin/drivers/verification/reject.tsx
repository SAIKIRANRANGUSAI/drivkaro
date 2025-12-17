"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPageWrapper from "@/components/admin/AdminPageWrapper";
import SkeletonCard from "@/components/admin/SkeletonCard";


export  function UsersPage() {
  return (
    <AdminPageWrapper
      title="Users Management"
      description="View and manage registered users"
    >
      <SkeletonCard />
    </AdminPageWrapper>
  );
}

export default function RejectPage() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [message, setMessage] = useState("");

  async function submit() {
    await fetch("/api/instructor/reject", {
      method: "POST",
      body: JSON.stringify({ id, message }),
    });

    router.push("/admin/drivers/verification");
  }

  return (
    <div className="p-8 max-w-lg mx-auto bg-white rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">Reject Instructor</h1>

      <textarea
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional message to instructor"
        className="w-full border p-3 rounded-lg mb-4"
      />

      <button
        onClick={submit}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
      >
        Confirm Reject
      </button>
    </div>
  );
}
