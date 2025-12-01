import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ExamRunner, type ClientQuestion } from '@/components/exams/exam-runner';

// Type definition for Prisma question result
interface PrismaQuestion {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: any;
  correctAnswer: string;
  points: number;
}

// Enable caching for this page (revalidate every 300 seconds = 5 min)
export const revalidate = 300;

export default async function StartExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Ensure user exists in DB (sync with Clerk)
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

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      passingScore: true,
      subject: {
        select: {
          id: true,
          title: true,
        },
      },
      questions: {
        select: {
          id: true,
          text: true,
          type: true,
          options: true,
          correctAnswer: true,
          points: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const clientQuestions: ClientQuestion[] = exam.questions.map((q: PrismaQuestion) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
  }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Meta header */}
        <header className="space-y-1 text-right">
          <p className="text-xs font-medium text-indigo-600 tracking-[0.2em]">
            اختبار
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {exam.title}
          </h1>
          <p className="text-sm text-slate-400">
            المادة: {exam.subject.title} · المدة: {exam.durationMinutes} دقيقة · درجة النجاح: {exam.passingScore}%
          </p>
        </header>

        <ExamRunner
          exam={{
            id: exam.id,
            title: exam.title,
            durationMinutes: exam.durationMinutes,
            passingScore: exam.passingScore,
            questions: clientQuestions,
          }}
        />
      </div>
    </div>
  );
}
