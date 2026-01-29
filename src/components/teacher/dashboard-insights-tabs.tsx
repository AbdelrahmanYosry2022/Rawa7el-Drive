"use client";

import { useState } from "react";
import { Activity, BarChart2, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type AttemptsPoint = {
  examId: string;
  title: string;
  subjectTitle: string;
  total: number;
};

type SuccessPoint = {
  examId: string;
  title: string;
  subjectTitle: string;
  total: number;
  successPercent: number;
};

type WeekPoint = {
  label: string;
  count: number;
};

interface DashboardInsightsTabsProps {
  attempts: AttemptsPoint[];
  success: SuccessPoint[];
  week: WeekPoint[];
}

export function DashboardInsightsTabs({
  attempts,
  success,
  week,
}: DashboardInsightsTabsProps) {
  const [activeTab, setActiveTab] = useState<"attempts" | "success" | "week">(
    "attempts",
  );

  const maxAttempts = attempts.reduce(
    (max, item) => (item.total > max ? item.total : max),
    0,
  );

  const maxSuccess = success.reduce(
    (max, item) => (item.successPercent > max ? item.successPercent : max),
    0,
  );

  const maxWeek = week.reduce(
    (max, item) => (item.count > max ? item.count : max),
    0,
  );

  return (
    <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold text-slate-900">تحليلات المنصة</h2>
            <p className="text-[11px] text-slate-500">
              نظرة بيانية على أداء الاختبارات ونشاط الطلاب.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1">
          <button
            type="button"
            onClick={() => setActiveTab("attempts")}
            className={cn(
              "px-3 py-1.5 text-[11px] rounded-full transition text-slate-500 flex items-center gap-1",
              activeTab === "attempts" &&
                "bg-white shadow-sm text-slate-900",
            )}
          >
            <FileText className="w-3 h-3" />
            <span>أكثر الاختبارات دخولاً</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("success")}
            className={cn(
              "px-3 py-1.5 text-[11px] rounded-full transition text-slate-500 flex items-center gap-1",
              activeTab === "success" &&
                "bg-white shadow-sm text-slate-900",
            )}
          >
            <TrendingUp className="w-3 h-3" />
            <span>أكثر الاختبارات نجاحاً</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("week")}
            className={cn(
              "px-3 py-1.5 text-[11px] rounded-full transition text-slate-500 flex items-center gap-1",
              activeTab === "week" &&
                "bg-white shadow-sm text-slate-900",
            )}
          >
            <Activity className="w-3 h-3" />
            <span>النشاط خلال ٧ أيام</span>
          </button>
        </div>
      </div>

      <div className="px-5 py-5">
        {activeTab === "attempts" && (
          <AttemptsChart attempts={attempts} maxAttempts={maxAttempts} />
        )}
        {activeTab === "success" && (
          <SuccessChart success={success} maxSuccess={maxSuccess} />
        )}
        {activeTab === "week" && <WeekChart week={week} maxWeek={maxWeek} />}
      </div>
    </div>
  );
}

function AttemptsChart({
  attempts,
  maxAttempts,
}: {
  attempts: AttemptsPoint[];
  maxAttempts: number;
}) {
  if (!attempts.length) {
    return (
      <p className="text-center text-xs text-slate-500">
        لا توجد محاولات كافية لعرض إحصائيات حتى الآن.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 text-right">
        أكثر الاختبارات من حيث عدد المحاولات.
      </p>
      <div className="h-56 flex items-end justify-between gap-3">
        {attempts.map((item) => {
          const base = maxAttempts > 0 ? maxAttempts : 1;
          const rawHeight = (item.total / base) * 160; // px
          const height = item.total === 0 ? 0 : Math.max(rawHeight, 8);
          return (
            <div
              key={item.examId}
              className="flex flex-col items-center justify-end gap-1 flex-1"
            >
              <div
                className="w-full rounded-t-md bg-indigo-500 shadow-sm"
                style={{ height: `${height}px` }}
              />
              <span className="text-[10px] text-slate-600 text-center line-clamp-2">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-400 text-center">
                {item.total} محاولة
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuccessChart({
  success,
  maxSuccess,
}: {
  success: SuccessPoint[];
  maxSuccess: number;
}) {
  if (!success.length) {
    return (
      <p className="text-center text-xs text-slate-500">
        لا توجد بيانات كافية لعرض نسب النجاح بعد.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 text-right">
        أعلى الاختبارات من حيث نسبة النجاح (مع حد أدنى من المحاولات).
      </p>
      <div className="h-56 flex items-end justify-between gap-3">
        {success.map((item) => {
          const base = maxSuccess > 0 ? maxSuccess : 1;
          const rawHeight = (item.successPercent / base) * 160; // px
          const height = item.successPercent === 0 ? 0 : Math.max(rawHeight, 8);
          return (
            <div
              key={item.examId}
              className="flex flex-col items-center justify-end gap-1 flex-1"
            >
              <div
                className="w-full rounded-t-md bg-emerald-500 shadow-sm"
                style={{ height: `${height}px` }}
              />
              <span className="text-[10px] text-slate-600 text-center line-clamp-2">
                {item.title}
              </span>
              <span className="text-[10px] text-slate-400 text-center">
                {item.successPercent}% نجاح
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekChart({
  week,
  maxWeek,
}: {
  week: WeekPoint[];
  maxWeek: number;
}) {
  if (!week.length || maxWeek === 0) {
    return (
      <p className="text-center text-xs text-slate-500">
        لا توجد محاولات خلال الأيام الماضية.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 text-right">
        توزيع المحاولات خلال آخر ٧ أيام.
      </p>
      <div className="h-56 flex items-end justify-between gap-2">
        {week.map((day) => {
          const base = maxWeek > 0 ? maxWeek : 1;
          const rawHeight = (day.count / base) * 160; // px
          const height = day.count === 0 ? 0 : Math.max(rawHeight, 8);
          return (
            <div
              key={day.label}
              className="flex flex-col items-center justify-end gap-1 flex-1"
            >
              <div
                className="w-full rounded-t-md bg-sky-500 shadow-sm"
                style={{ height: `${height}px` }}
              />
              <span className="text-[10px] text-slate-500">{day.label}</span>
              <span className="text-[10px] text-slate-600">{day.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
