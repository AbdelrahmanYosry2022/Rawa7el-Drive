import { Card, CardContent } from '@rawa7el/ui/card';
import { ArrowRight } from 'lucide-react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-6 animate-pulse">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
      </div>

      {/* Subject info card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100 shadow-sm mb-8">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="h-8 w-48 bg-slate-200 rounded"></div>
              <div className="h-4 w-full bg-slate-200 rounded"></div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
            </div>
            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex-shrink-0"></div>
          </div>
        </CardContent>
      </Card>

      {/* Exams section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-slate-200 rounded"></div>
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white border border-slate-100 shadow-sm rounded-xl">
              <CardContent className="p-5 space-y-4">
                {/* Exam title and badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                </div>

                {/* Exam details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-28 bg-slate-200 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  </div>
                </div>

                {/* Button skeleton */}
                <div className="h-10 w-full bg-slate-200 rounded-lg mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
