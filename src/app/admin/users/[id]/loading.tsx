export default function Loading() {
  return (
    <div className="p-8 space-y-10 animate-pulse">

      {/* HEADER */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>

      {/* BASIC INFO CARD */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />

        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-72 bg-gray-200 rounded" />
        ))}
      </div>

      {/* BOOKINGS CARD */}
      <div className="bg-white rounded-2xl shadow p-8 space-y-6">
        <div className="h-6 w-40 bg-gray-200 rounded" />

        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-300 rounded" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-16 bg-blue-200 rounded" />
            </div>

            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

    </div>
  );
}
