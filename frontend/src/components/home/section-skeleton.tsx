export function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="h-40 sm:h-44 bg-navy-100 animate-pulse" />
          <div className="p-4 sm:p-5 space-y-2">
            <div className="h-4 bg-navy-100 animate-pulse rounded" />
            <div className="h-3 bg-navy-100/60 animate-pulse rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
