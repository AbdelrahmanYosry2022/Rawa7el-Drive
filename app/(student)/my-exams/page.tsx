import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { MyExamsTable, type MyExamSubmissionClient } from '@/components/student/my-exams-table';

export const revalidate = 0;

export default async function MyExamsPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });

  if (!dbUser) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      redirect('/');
    }

    dbUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email,
        role: 'STUDENT',
      },
    });
  }

  const submissions = await prisma.submission.findMany({
    where: { userId: dbUser.id },
    include: {
      exam: {
        include: {
          subject: true,
          questions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const clientSubmissions: MyExamSubmissionClient[] = submissions.map((submission) => {
    const exam = submission.exam;
    const subject = exam.subject;

    let totalPoints = 0;
    let scorePoints = 0;

    const rawAnswers = submission.answers as unknown;
    const answersMap: Record<string, string | null | undefined> =
      rawAnswers && typeof rawAnswers === 'object' ? (rawAnswers as any) : {};

    const details = exam.questions.map((q) => {
      totalPoints += q.points;
      const userAnswer = (answersMap[q.id] as string | null | undefined) ?? null;
      const isCorrect = userAnswer !== null && userAnswer === q.correctAnswer;
      if (isCorrect) {
        scorePoints += q.points;
      }

      let options: string[] = [];
      try {
        if (q.options && typeof q.options === 'object') {
          options = q.options as string[];
        }
      } catch {
        options = [];
      }

      return {
        questionId: q.id,
        text: q.text,
        options,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const percentage = totalPoints > 0 ? Math.round((scorePoints / totalPoints) * 100) : 0;

    return {
      id: submission.id,
      examTitle: exam.title,
      subjectTitle: subject.title,
      createdAt: submission.createdAt.toISOString(),
      percentage,
      passed: submission.passed,
      details,
    };
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">اختباراتي</h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل بكل الاختبارات التي قمت بأدائها ونتائجها.
          </p>
        </div>
      </div>

      <div id="my-exams-table">
        <MyExamsTable submissions={clientSubmissions} />
      </div>
    </div>
  );
}
