export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        {/* Icon skeleton */}
        <div className="h-16 w-16 bg-indigo-200 rounded-full"></div>
        
        {/* Text skeleton */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-3 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
