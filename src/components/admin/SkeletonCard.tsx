export default function SkeletonCard({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-sm border p-4 mb-4"
        >
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
