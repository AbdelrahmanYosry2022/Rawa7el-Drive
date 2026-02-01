'use server';

import { createClient as createServerClient } from '@rawa7el/supabase/server';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return dbUser;
}

export interface QuestionAnalytics {
  questionId: string;
  text: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number; // 0-100
}

export interface ExamAnalyticsResult {
  examId: string;
  title: string;
  questionCount: number;
  attemptCount: number;
  questions: QuestionAnalytics[];
}

export async function getExamAnalytics(examId: string): Promise<ExamAnalyticsResult> {
  await requireAdmin();

  if (!examId) {
    throw new Error('Exam id is required');
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { createdAt: 'asc' },
      },
      submissions: {
        // نستخدم كل المحاولات التي تحتوي على إجابات
        select: {
          answers: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  const questionStats: Record<
    string,
    { text: string; totalAttempts: number; correctCount: number; correctAnswer: string }
  > = {};

  for (const q of exam.questions) {
    questionStats[q.id] = {
      text: q.text,
      totalAttempts: 0,
      correctCount: 0,
      correctAnswer: q.correctAnswer,
    };
  }

  for (const submission of exam.submissions) {
    const raw = submission.answers as unknown;
    if (!raw || typeof raw !== 'object') continue;

    const answers = raw as Record<string, string | null | undefined>;

    for (const [questionId, answer] of Object.entries(answers)) {
      const stat = questionStats[questionId];
      if (!stat) continue;

      stat.totalAttempts += 1;
      if (answer != null && answer === stat.correctAnswer) {
        stat.correctCount += 1;
      }
    }
  }

  const questions: QuestionAnalytics[] = Object.entries(questionStats).map(
    ([questionId, stat]) => {
      const { text, totalAttempts, correctCount } = stat;
      const accuracy =
        totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      return {
        questionId,
        text,
        totalAttempts,
        correctCount,
        accuracy,
      };
    },
  );

  return {
    examId: exam.id,
    title: exam.title,
    questionCount: exam.questions.length,
    attemptCount: exam.submissions.length,
    questions,
  };
}
