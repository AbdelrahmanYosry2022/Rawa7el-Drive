import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ExamQuestionBuilder, type ClientQuestion } from '@/components/teacher/exam-question-builder';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Target, GraduationCap } from 'lucide-react';
import { BackButton } from '@/components/teacher/back-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExamExportDropdown } from '@/components/teacher/exam-export-dropdown';
import type { ExportQuestion } from '@/lib/export-exam';

// Type definitions
interface ExamQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: any;
  correctAnswer: string;
  points: number;
}

interface ExamSubmission {
  id: string;
  score: number | null;
  passed: boolean;
  createdAt: Date;
  user: {
    email: string;
    name: string | null;
  } | null;
}

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
      submissions: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const clientQuestions: ClientQuestion[] = exam.questions.map((q: ExamQuestion) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswer: q.correctAnswer,
    points: q.points,
  }));

  // For export functionality
  const exportQuestions: ExportQuestion[] = exam.questions.map((q: ExamQuestion) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswer: q.correctAnswer,
    points: q.points,
  }));

  const hasSubmissions = exam.submissions.length > 0;

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
          <ExamExportDropdown 
            examTitle={exam.title} 
            questions={exportQuestions} 
          />
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

      {/* Tabs: Questions / Results */}
      <Tabs defaultValue="questions" className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="questions">الأسئلة</TabsTrigger>
            <TabsTrigger value="results">النتائج</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="questions">
          <ExamQuestionBuilder 
            examId={exam.id} 
            initialQuestions={clientQuestions}
            examTimerMode={exam.timerMode}
            examQuestionTimeSeconds={exam.questionTimeSeconds}
          />
        </TabsContent>

        <TabsContent value="results">
          <Card className="bg-white border border-slate-100 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">نتائج الطلاب</h3>
                <span className="text-xs text-slate-400">
                  {exam.submissions.length} محاولة
                </span>
              </div>

              {!hasSubmissions ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  لم يقم أحد بأداء هذا الاختبار بعد.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الطالب</TableHead>
                      <TableHead>الدرجة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.submissions.map((submission: ExamSubmission) => {
                      const date = new Date(submission.createdAt);
                      const formattedDate = date.toLocaleDateString('ar-EG');
                      const score = submission.score ?? 0;
                      const passed = submission.passed;

                      return (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center justify-start gap-4">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-semibold text-indigo-700">
                                {submission.user?.name?.charAt(0).toUpperCase() || submission.user?.email?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-medium text-slate-800">
                                  {submission.user?.name || submission.user?.email || 'طالب غير معروف'}
                                </p>
                                {submission.user?.name && submission.user?.email && (
                                  <p className="text-[11px] text-slate-500">
                                    {submission.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{score}/100</TableCell>
                          <TableCell>
                            <span
                              className={
                                passed
                                  ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                              }
                            >
                              {passed ? 'ناجح' : 'راسب'}
                            </span>
                          </TableCell>
                          <TableCell>{formattedDate}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
