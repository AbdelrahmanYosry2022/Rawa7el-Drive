import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Search, Folder, GraduationCap, Clock, CheckCircle2, Target, Percent } from 'lucide-react';

// Type definitions for dashboard data
interface DashboardSubject {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: { exams: number };
}

interface DashboardExam {
  id: string;
  title: string;
  durationMinutes: number;
  timerMode: 'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION';
  subject: { title: string; color: string | null };
  _count: { questions: number };
  createdAt: Date;
}

interface Submission {
  score: number | null;
  passed: boolean;
  answers: unknown;
}

// Enable caching for this page (revalidate every 60 seconds)
export const revalidate = 60;

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Ensure User Exists in DB (sync with Clerk)
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!dbUser) {
    const email = user.emailAddresses[0]?.emailAddress;
    const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
    if (email) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email,
          name,
          role: 'STUDENT',
        },
      });
    } else {
      redirect('/sign-in');
    }
  } else if (!dbUser.name && user.fullName) {
    // Update name if it's missing
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { name: user.fullName },
    });
    dbUser.name = user.fullName;
  }

  // Fetch user submissions for stats (optimized query)
  const submissions = await prisma.submission.findMany({
    where: { userId: dbUser.id },
    select: {
      score: true,
      passed: true,
      answers: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const completedExams = submissions.length;
  const passedExams = submissions.filter((s: Submission) => s.passed).length;
  const averageScore =
    completedExams > 0
      ? Math.round(submissions.reduce((sum: number, s: Submission) => sum + (s.score ?? 0), 0) / completedExams)
      : 0;
  const successRate = completedExams > 0 ? Math.round((passedExams / completedExams) * 100) : 0;

  const totalQuestionsAnswered = submissions.reduce((sum: number, s: Submission) => {
    if (!s.answers || typeof s.answers !== 'object') return sum;
    try {
      const obj = s.answers as Record<string, unknown>;
      return sum + Object.keys(obj).length;
    } catch {
      return sum;
    }
  }, 0);

  // Fetch real subjects with exam count (limit to 6 for performance)
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      icon: true,
      color: true,
      _count: {
        select: { exams: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  // Fetch recent exams (limit 4)
  const recentExams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      timerMode: true,
      createdAt: true,
      subject: {
        select: {
          title: true,
          color: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header: title, meta, avatars & actions */}
      <section id="dashboard-header" className="text-right">
        <h1 className="text-3xl font-bold text-slate-900">رواحل درايف</h1>
        <p className="text-xs text-slate-400 mt-1">
          {subjects.length} مادة · {recentExams.length} اختبار
        </p>
      </section>

      {/* Stats cards */}
      <section id="stats-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="الاختبارات المنجزة"
          value={completedExams}
          subtitle="إجمالي محاولات الاختبارات"
          icon={GraduationCap}
          color="blue"
        />
        <StatsCard
          title="تم الاجتياز"
          value={passedExams}
          subtitle="عدد الاختبارات الناجحة"
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="متوسط الدرجة"
          value={completedExams > 0 ? `${averageScore}%` : '—'}
          subtitle="متوسط نتائجك في كل المحاولات"
          icon={Target}
          color="purple"
        />
        <StatsCard
          title="نسبة النجاح"
          value={completedExams > 0 ? `${successRate}%` : '—'}
          subtitle="من جميع الاختبارات التي خضتها"
          icon={Percent}
          color="orange"
        />
      </section>

      {/* Subjects (Folders) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">المواد الدراسية</h2>
          <span className="text-xs text-slate-400">{subjects.length} مادة</span>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-12 text-center">
            <Folder className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm">لا توجد مواد دراسية حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {subjects.map((subject: DashboardSubject) => (
              <Link key={subject.id} href={`/subjects/${subject.id}`}>
                <Card className="bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col items-center justify-center py-6 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-0">
                    <div
                      className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"
                      style={subject.color ? { backgroundColor: `${subject.color}20`, color: subject.color } : {}}
                    >
                      {subject.icon ? (
                        <span className="text-2xl">{subject.icon}</span>
                      ) : (
                        <Folder className="w-8 h-8" />
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-slate-900">{subject.title}</p>
                      <p className="text-[11px] text-slate-400">{subject._count.exams} اختبار</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Available Exams */}
      <section id="recent-exams" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">الاختبارات المتاحة</h2>
          <span className="text-xs text-slate-400">{recentExams.length} اختبار</span>
        </div>

        {recentExams.length === 0 ? (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm">لا توجد اختبارات متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {recentExams.map((exam: DashboardExam) => (
              <Link key={exam.id} href={`/exams/${exam.id}`}>
                <Card className="bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {exam.timerMode === 'NONE' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                            بدون توقيت
                          </span>
                        )}
                        {exam.timerMode === 'EXAM_TOTAL' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-indigo-100 text-indigo-600">
                            ⏱️ {exam.durationMinutes} دقيقة
                          </span>
                        )}
                        {exam.timerMode === 'PER_QUESTION' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-600">
                            ⏱️ لكل سؤال
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {exam.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">
                        {exam.subject.title}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{exam.durationMinutes} دقيقة</span>
                      </div>
                      <span>{exam._count.questions} سؤال</span>
                    </div>

                    <p className="text-[11px] text-slate-400 text-left rtl:text-right">
                      {formatDate(exam.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
