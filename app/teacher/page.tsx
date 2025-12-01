import { prisma } from '@/lib/prisma';
import { Activity, BookOpen, FileText, Users } from 'lucide-react';
import { DashboardInsightsTabs } from '@/components/teacher/dashboard-insights-tabs';

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export default async function TeacherDashboardPage() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);

  // Aggregate stats and base data
  const [
    totalStudents,
    totalSubjects,
    totalExams,
    totalSubmissions,
    recentSubmissions,
    submissionsByExam,
    passedSubmissionsByExam,
    recentWeekSubmissions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.subject.count(),
    prisma.exam.count(),
    prisma.submission.count(),
    prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        exam: true,
      },
    }),
    prisma.submission.groupBy({
      by: ['examId'],
      _count: { examId: true },
    }),
    prisma.submission.groupBy({
      by: ['examId'],
      where: { passed: true },
      _count: { examId: true },
    }),
    prisma.submission.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Build success / attempts stats per exam
  const passedMap = new Map(
    passedSubmissionsByExam.map((item) => [item.examId, item._count.examId])
  );

  const examStats = submissionsByExam.map((item) => {
    const total = item._count.examId;
    const passed = passedMap.get(item.examId) ?? 0;
    const rate = total > 0 ? passed / total : 0;

    return {
      examId: item.examId,
      total,
      passed,
      rate,
    };
  });

  const topByAttempts = [...examStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topBySuccess = [...examStats]
    .filter((stat) => stat.total >= 3)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  const topExamIds = Array.from(
    new Set([...topByAttempts.map((s) => s.examId), ...topBySuccess.map((s) => s.examId)])
  );

  const topExamRecords = topExamIds.length
    ? await prisma.exam.findMany({
        where: { id: { in: topExamIds } },
        include: { subject: true },
      })
    : [];

  const examById = new Map(topExamRecords.map((exam) => [exam.id, exam]));

  // Build 7-day submissions chart data
  const countsByDay: Record<string, number> = {};
  for (const sub of recentWeekSubmissions) {
    const key = sub.createdAt.toISOString().slice(0, 10);
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  }

  const last7Days: { label: string; key: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('ar-EG', { weekday: 'short' });
    last7Days.push({ label, key, count: countsByDay[key] || 0 });
  }

  const maxCount = last7Days.reduce((max, day) => (day.count > max ? day.count : max), 0);

  // Prepare data for charts tabs
  const attemptsChartData = topByAttempts
    .map((stat) => {
      const exam = examById.get(stat.examId);
      if (!exam) return null;
      return {
        examId: stat.examId,
        title: exam.title,
        subjectTitle: exam.subject?.title || 'مادة غير معروفة',
        total: stat.total,
      };
    })
    .filter(Boolean) as {
    examId: string;
    title: string;
    subjectTitle: string;
    total: number;
  }[];

  const successChartData = topBySuccess
    .map((stat) => {
      const exam = examById.get(stat.examId);
      if (!exam) return null;
      const successPercent = Math.round(stat.rate * 100);
      return {
        examId: stat.examId,
        title: exam.title,
        subjectTitle: exam.subject?.title || 'مادة غير معروفة',
        total: stat.total,
        successPercent,
      };
    })
    .filter(Boolean) as {
    examId: string;
    title: string;
    subjectTitle: string;
    total: number;
    successPercent: number;
  }[];

  const weekChartData = last7Days.map((day) => ({
    label: day.label,
    count: day.count,
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 text-right">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">لوحة التحكم</h1>
        <p className="text-sm text-slate-500">
          نظرة عامة سريعة على المنصة، عدد الطلاب والمواد والاختبارات، وآخر محاولات الطلاب.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[11px] text-slate-500">إجمالي الطلاب</p>
            <p className="text-xl font-semibold text-slate-900">{totalStudents}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[11px] text-slate-500">إجمالي المواد</p>
            <p className="text-xl font-semibold text-slate-900">{totalSubjects}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[11px] text-slate-500">إجمالي الاختبارات</p>
            <p className="text-xl font-semibold text-slate-900">{totalExams}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div className="text-right flex-1">
            <p className="text-[11px] text-slate-500">إجمالي المحاولات</p>
            <p className="text-xl font-semibold text-slate-900">{totalSubmissions}</p>
          </div>
        </div>
      </div>

      {/* Insights tabs (charts) */}
      <div className="mt-4">
        <DashboardInsightsTabs
          attempts={attemptsChartData}
          success={successChartData}
          week={weekChartData}
        />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 className="text-sm font-semibold text-slate-900">آخر محاولات الطلاب</h2>
              <p className="text-[11px] text-slate-500">أحدث ٥ محاولات في الاختبارات.</p>
            </div>
          </div>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-slate-500">
            لا توجد محاولات بعد على أي اختبار.
          </div>
        ) : (
          <div className="px-5 py-4 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 font-medium">الطالب</th>
                  <th className="py-2 font-medium">الاختبار</th>
                  <th className="py-2 font-medium">النتيجة</th>
                  <th className="py-2 font-medium">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSubmissions.map((submission) => {
                  const studentName =
                    submission.user?.name || submission.user?.email || 'طالب غير معروف';
                  const examTitle = submission.exam?.title || 'اختبار محذوف';
                  const score = submission.score ?? 0;
                  const passed = submission.passed;
                  const relative = formatRelativeTime(submission.createdAt);

                  return (
                    <tr key={submission.id} className="align-middle">
                      <td className="py-2">
                        <div className="flex items-center justify-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600">
                            {studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-slate-900">{studentName}</p>
                            {submission.user?.email && submission.user.email !== studentName && (
                              <p className="text-[11px] text-slate-500">{submission.user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-xs text-slate-800">{examTitle}</td>
                      <td className="py-2">
                        <span
                          className={
                            passed
                              ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                          }
                        >
                          {score}/100 · {passed ? 'ناجح' : 'راسب'}
                        </span>
                      </td>
                      <td className="py-2 text-[11px] text-slate-500">{relative}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
