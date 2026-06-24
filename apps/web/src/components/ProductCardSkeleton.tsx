export default function ProductCardSkeleton() {
  return (
    <div className="skeleton rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
      <div className="relative aspect-square bg-gray-50">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="h-6 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-4 w-14 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
