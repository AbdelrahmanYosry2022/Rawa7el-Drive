export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-4 w-64 bg-slate-200 rounded"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-5 space-y-3">
              <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
              <div className="h-10 w-full bg-slate-200 rounded-lg mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
