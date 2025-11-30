import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ExamQuestionBuilder, type ClientQuestion } from '@/components/teacher/exam-question-builder';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Target, GraduationCap } from 'lucide-react';
import { BackButton } from '@/components/teacher/back-button';

export default async function TeacherExamEditorPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: true,
      questions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const clientQuestions: ClientQuestion[] = exam.questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswer: q.correctAnswer,
    points: q.points,
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <BackButton />
          <div className="flex items-center gap-3 justify-start flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
                {exam.title}
              </h1>
              <p className="text-xs text-slate-500">
                المادة: {exam.subject.title}
              </p>
            </div>
          </div>
        </div>

        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                المدة: {exam.durationMinutes} دقيقة
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                درجة النجاح: {exam.passingScore}%
              </span>
            </div>
            <span>عدد الأسئلة الحالي: {clientQuestions.length}</span>
          </CardContent>
        </Card>
      </div>

      <ExamQuestionBuilder examId={exam.id} initialQuestions={clientQuestions} />
    </div>
  );
}
