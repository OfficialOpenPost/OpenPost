export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-12">
      {/* Hero skeleton */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="h-10 w-64 bg-gray-100 rounded-lg mx-auto animate-pulse" />
        <div className="h-5 w-96 bg-gray-100 rounded-lg mx-auto animate-pulse" />
        <div className="h-9 w-32 bg-gray-100 rounded-lg mx-auto animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-gray-100" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-full bg-gray-100 rounded" />
              <div className="h-5 w-3/4 bg-gray-100 rounded" />
              <div className="pt-3 border-t border-gray-50 flex justify-between">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
