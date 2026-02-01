import { createClient as createServerClient } from '@rawa7el/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { ExamPreStart } from '@/components/exams/exam-pre-start';

export const revalidate = 0;

export default async function ExamOverviewPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser) {
    const email = user.email;
    if (email) {
      // @ts-ignore - ignoring type check for now since we are in transition
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email,
          role: 'STUDENT',
          platform: 'TAHT_EL_ESHREEN',
          isActive: true
        },
      });
    }
  }

  if (!dbUser) {
    redirect('/login');
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      durationMinutes: true,
      passingScore: true,
      timerMode: true,
      questionTimeSeconds: true,
      subject: {
        select: {
          id: true,
          title: true,
        },
      },
      questions: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!exam) {
    notFound();
  }

  const lastAttempt = await prisma.submission.findFirst({
    where: {
      userId: dbUser.id,
      examId: exam.id,
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      score: true,
      passed: true,
      createdAt: true,
    },
  });

  return (
    <ExamPreStart
      exam={{
        id: exam.id,
        title: exam.title,
        subjectTitle: exam.subject.title,
        durationMinutes: exam.durationMinutes,
        passingScore: exam.passingScore,
        timerMode: exam.timerMode,
        questionTimeSeconds: exam.questionTimeSeconds,
        questionCount: exam.questions.length,
      }}
      lastAttempt={
        lastAttempt
          ? {
              score: lastAttempt.score ?? 0,
              passed: lastAttempt.passed,
              date: lastAttempt.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
