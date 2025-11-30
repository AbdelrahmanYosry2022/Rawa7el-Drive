import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Folder, GraduationCap, Clock } from 'lucide-react';

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
    if (email) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email,
          role: 'STUDENT',
        },
      });
    }
  }

  // Fetch real subjects with exam count
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: { exams: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch recent exams (limit 4)
  const recentExams = await prisma.exam.findMany({
    include: {
      subject: true,
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  const createdDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
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
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-right">
          <h1 className="text-3xl font-bold text-slate-900">أكاديمية الأساس</h1>
          <p className="text-xs text-slate-400">
            تم الإنشاء: {createdDate} · {subjects.length} مادة · {recentExams.length} اختبار
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar group */}
          <div className="flex -space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              {user.firstName?.[0] || 'ط'}
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              أ
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-400 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              م
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-[10px] font-semibold text-slate-600 flex items-center justify-center shadow-sm">
              +3
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 h-9 text-sm"
            >
              مشاركة
            </Button>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 h-9 text-sm shadow-sm">
              تعديل
            </Button>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3 flex items-center gap-3 max-w-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن دورة أو ملف..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-400 text-slate-700"
          />
        </div>
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
            {subjects.map((subject) => (
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
      <section className="space-y-4">
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
            {recentExams.map((exam) => (
              <Link key={exam.id} href={`/exams/${exam.id}/start`}>
                <Card className="bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-600">
                        اختبار
                      </span>
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
