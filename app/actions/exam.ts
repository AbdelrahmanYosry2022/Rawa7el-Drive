'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export type StartExamSessionResult =
  | { success: true; startedAt: string }
  | { success: false; error: string };

export async function startExamSession(examId: string): Promise<StartExamSessionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user) {
    return { success: false, error: 'User profile not found' };
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });

  if (!exam) {
    return { success: false, error: 'Exam not found' };
  }

  // Reuse existing ongoing submission if present
  const existing = await prisma.submission.findFirst({
    where: {
      userId: user.id,
      examId: exam.id,
      status: 'ONGOING',
    },
    orderBy: { startedAt: 'desc' },
  });

  if (existing) {
    return { success: true, startedAt: existing.startedAt.toISOString() };
  }

  const created = await prisma.submission.create({
    data: {
      userId: user.id,
      examId: exam.id,
      // score remains null until completion
      passed: false,
      status: 'ONGOING',
      answers: {},
    },
  });

  return { success: true, startedAt: created.startedAt.toISOString() };
}
