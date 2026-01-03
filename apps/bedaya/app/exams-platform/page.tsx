import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { 
  GraduationCap, 
  Clock, 
  ArrowRight,
  FolderOpen,
  Timer,
  TimerOff
} from 'lucide-react';

export const revalidate = 60;

interface ExamWithSubject {
  id: string;
  title: string;
  durationMinutes: number;
  timerMode: 'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION';
  subject: { 
    id: string;
    title: string; 
    color: string | null;
    icon: string | null;
  };
  _count: { questions: number };
  createdAt: Date;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export default async function ExamsListPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch all exams grouped by subject
  const subjects = await prisma.subject.findMany({
    include: {
      exams: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { questions: true },
          },
        },
      },
      _count: {
        select: { exams: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  const totalExams = subjects.reduce((sum, s) => sum + s._count.exams, 0);

  // Get recent exams across all subjects
  const recentExams = await prisma.exam.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      subject: {
        select: {
          id: true,
          title: true,
          color: true,
          icon: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">منصة الاختبارات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalExams} اختبار متاح
          </p>
        </div>
      </div>

      {/* Recent Exams */}
      {recentExams.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            أحدث الاختبارات
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentExams.map((exam: ExamWithSubject) => (
              <Link key={exam.id} href={`/exams-platform/${exam.id}`}>
                <Card className="bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-slate-200 transition-all cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          backgroundColor: exam.subject.color ? `${exam.subject.color}20` : '#E0E7FF',
                          color: exam.subject.color || '#6366F1'
                        }}
                      >
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {exam.timerMode === 'NONE' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 flex items-center gap-1">
                            <TimerOff className="w-3 h-3" />
                            بدون توقيت
                          </span>
                        )}
                        {exam.timerMode === 'EXAM_TOTAL' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-indigo-100 text-indigo-600 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {exam.durationMinutes} دقيقة
                          </span>
                        )}
                        {exam.timerMode === 'PER_QUESTION' && (
                          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-600 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            لكل سؤال
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {exam.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {exam.subject.title}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>{exam._count.questions} سؤال</span>
                      <span>{formatDate(exam.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Exams by Subject */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد اختبارات حالياً</p>
          <p className="text-slate-400 text-sm mt-1">سيتم إضافة الاختبارات قريباً</p>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-sm font-semibold text-slate-500">حسب المادة</h2>
          
          {subjects.map((subject) => (
            <section key={subject.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: subject.color ? `${subject.color}20` : '#E0E7FF',
                      color: subject.color || '#6366F1'
                    }}
                  >
                    {subject.icon ? (
                      <span className="text-lg">{subject.icon}</span>
                    ) : (
                      <FolderOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{subject.title}</h3>
                    <p className="text-xs text-slate-400">{subject._count.exams} اختبار</p>
                  </div>
                </div>
                <Link 
                  href={`/subjects/${subject.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  عرض المادة
                </Link>
              </div>

              {subject.exams.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <p className="text-slate-400 text-sm">لا توجد اختبارات في هذه المادة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subject.exams.map((exam) => (
                    <Link key={exam.id} href={`/exams-platform/${exam.id}`}>
                      <Card className="bg-white border border-slate-100 rounded-lg hover:shadow-md hover:border-slate-200 transition-all cursor-pointer h-full">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            {exam.timerMode !== 'NONE' && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {exam.durationMinutes} د
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                              {exam.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {exam._count.questions} سؤال
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
