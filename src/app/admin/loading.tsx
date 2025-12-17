import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>

      {/* Card / Table Skeleton */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 bg-gray-100 p-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded" />
          ))}
        </div>

        {/* Table rows */}
        {[...Array(6)].map((_, row) => (
          <div
            key={row}
            className="grid grid-cols-6 gap-4 p-4 border-t"
          >
            {[...Array(6)].map((_, col) => (
              <div key={col} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


