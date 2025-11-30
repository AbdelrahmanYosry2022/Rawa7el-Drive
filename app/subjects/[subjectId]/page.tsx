import { ArrowRight, GraduationCap, Clock, Target } from 'lucide-react';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params;

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Ensure user exists in DB
  let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });
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

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      exams: {
        include: {
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  // Fetch submissions for this subject's exams for the current user
  const examIds = subject.exams.map((e) => e.id);
  const submissions = examIds.length
    ? await prisma.submission.findMany({
        where: {
          userId: dbUser!.id,
          examId: { in: examIds },
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const submissionsByExamId = new Map<string, (typeof submissions)[number]>();
  for (const sub of submissions) {
    if (!submissionsByExamId.has(sub.examId)) {
      submissionsByExamId.set(sub.examId, sub);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <section className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {subject.icon ? (
              <span className="text-4xl">{subject.icon}</span>
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={subject.color ? { backgroundColor: subject.color } : { backgroundColor: '#6366f1' }}
              >
                <GraduationCap className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-slate-900">{subject.title}</h1>
          </div>
          {subject.description && (
            <p className="text-slate-500 text-lg">{subject.description}</p>
          )}
        </div>
      </section>

      {/* Exams Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            الاختبارات المتاحة
          </h2>
          <span className="text-sm text-slate-400">
            {subject.exams.length} اختبار
          </span>
        </div>

        {subject.exams.length === 0 ? (
          <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-16 text-center">
            <GraduationCap className="w-20 h-20 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              لا توجد اختبارات حالياً
            </h3>
            <p className="text-slate-500">
              سيتم إضافة اختبارات لهذه المادة قريباً
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subject.exams.map((exam) => {
              const submission = submissionsByExamId.get(exam.id);
              const hasSubmission = !!submission;
              const passed = submission?.passed;
              const score = submission?.score;

              let badgeLabel: string | null = null;
              let badgeClass = '';

              if (hasSubmission && typeof score === 'number') {
                if (passed) {
                  badgeLabel = `مكتمل (${score}%)`;
                  badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                } else {
                  badgeLabel = `راسب (${score}%)`;
                  badgeClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                }
              }

              return (
                <Card
                  key={exam.id}
                  className="bg-white shadow-sm rounded-xl hover:shadow-md transition-shadow relative"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Top row: Icon + status badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      {badgeLabel && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                        {exam.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>المدة: {exam.durationMinutes} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          <span>درجة النجاح: {exam.passingScore}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center text-xs font-semibold bg-slate-100 text-slate-600 rounded">
                            ?
                          </span>
                          <span>{exam._count.questions} سؤال</span>
                        </div>
                      </div>

                      {/* Action Button (always visible) */}
                      <Link href={`/exams/${exam.id}/start`}>
                        <Button
                          variant={hasSubmission ? 'outline' : 'default'}
                          className={
                            hasSubmission
                              ? 'w-full border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'w-full bg-indigo-600 hover:bg-indigo-700 text-white'
                          }
                        >
                          {hasSubmission ? 'أعد الاختبار' : 'ابدأ الاختبار'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
