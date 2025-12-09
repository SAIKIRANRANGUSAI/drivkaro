export function Badge({ children, className = "" }: any) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-sm font-medium ${className}`}
    >
      {children}
    </span>
  );
}
