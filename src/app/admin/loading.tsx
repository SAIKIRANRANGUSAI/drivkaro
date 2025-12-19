import { Search } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-pulse bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">

      {/* HEADER SKELETON */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded-full" />
      </div>

      {/* SEARCH BAR SKELETON */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-3 text-gray-300" />
        <div className="h-12 bg-gray-200 rounded-xl w-full" />
      </div>

      {/* GRID SKELETON */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg border p-6 space-y-4"
          >
            {/* Top row */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-300" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-gray-300 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Info lines */}
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-52 bg-gray-200 rounded" />

            {/* Footer link */}
            <div className="h-4 w-24 bg-blue-200 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* PAGINATION SKELETON */}
      <div className="flex justify-between items-center mt-6">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-40 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
