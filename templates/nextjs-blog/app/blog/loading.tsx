export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="flex gap-2 pt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-gray-100" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-full bg-gray-100 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
