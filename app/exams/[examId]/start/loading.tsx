export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>

        {/* Timer skeleton */}
        <div className="flex justify-center">
          <div className="h-12 w-32 bg-indigo-200 rounded-lg"></div>
        </div>

        {/* Question skeleton */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-6 space-y-4">
          <div className="h-6 w-full bg-slate-200 rounded"></div>
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
