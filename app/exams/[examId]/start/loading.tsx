import { Card, CardContent } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 animate-pulse">
      {/* Header */}
      <div className="mb-8 space-y-3 text-center">
        <div className="h-8 w-64 bg-slate-200 rounded mx-auto"></div>
        <div className="h-4 w-48 bg-slate-200 rounded mx-auto"></div>
      </div>

      {/* Timer card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-5 h-5 bg-slate-200 rounded"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-4 w-16 bg-slate-200 rounded"></div>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full"></div>
      </div>

      {/* Question card */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardContent className="p-6 space-y-6">
          {/* Question number and text */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-200 rounded-full"></div>
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
            </div>
            <div className="h-6 w-full bg-slate-200 rounded"></div>
            <div className="h-6 w-5/6 bg-slate-200 rounded"></div>
          </div>

          {/* Options skeleton */}
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 w-full bg-slate-200 rounded-lg"></div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
