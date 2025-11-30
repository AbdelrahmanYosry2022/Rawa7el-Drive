import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, Target, GraduationCap, Trash2 } from 'lucide-react';
import { deleteExam } from '@/app/actions/teacher/exams';
import { CreateExamModal } from '@/components/teacher/create-exam-modal';
import { EditExamModal } from '@/components/teacher/edit-exam-modal';
import { BackButton } from '@/components/teacher/back-button';

async function handleDeleteExam(formData: FormData) {
  'use server';

  const id = String(formData.get('id') || '');
  if (!id) return;

  await deleteExam(id);
}

export default async function TeacherSubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      exams: {
        include: {
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2 text-right flex-1">
          <div className="flex items-center justify-between gap-4">
            <BackButton />
            <div className="flex items-center gap-3 justify-start flex-1">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                  {subject.title}
                </h1>
                {subject.description && (
                  <p className="text-xs text-slate-500 max-w-xl">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <CreateExamModal subjectId={subject.id} />
        </div>
      </div>

      {/* Exams list */}
      {subject.exams.length === 0 ? (
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="py-10 text-center text-slate-500 text-sm">
            لا توجد اختبارات لهذه المادة بعد. ابدأ بإنشاء أول اختبار من زر "إنشاء اختبار".
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">اختبارات المادة</h2>
            <span className="text-xs text-slate-400">{subject.exams.length} اختبار</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subject.exams.map((exam) => (
              <Card
                key={exam.id}
                className="bg-white border border-slate-100 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-150"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 text-right">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {exam.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 justify-end">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.durationMinutes} دقيقة
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          درجة النجاح: {exam.passingScore}%
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-slate-50 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                      {exam._count.questions} سؤال
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                    <Link
                      href={`/teacher/exams/${exam.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      إدارة الأسئلة
                    </Link>
                    <div className="flex items-center gap-1">
                      <EditExamModal
                        examId={exam.id}
                        initialTitle={exam.title}
                        initialDurationMinutes={exam.durationMinutes}
                        initialPassingScore={exam.passingScore}
                      />
                      <form action={handleDeleteExam}>
                        <input type="hidden" name="id" value={exam.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          aria-label="حذف الاختبار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
