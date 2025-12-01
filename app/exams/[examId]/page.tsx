import { currentUser } from '@clerk/nextjs/server';
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

  if (!dbUser) {
    redirect('/sign-in');
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

  // Get last completed submission for this user and exam
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
