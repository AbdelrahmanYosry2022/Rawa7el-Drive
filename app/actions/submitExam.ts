'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export type ExamQuestionDetail = {
  questionId: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};

export type ExamSubmissionResult =
  | {
      success: true;
      score: number; // raw points
      totalPoints: number;
      percentage: number;
      passed: boolean;
      details: ExamQuestionDetail[];
    }
  | {
      success: false;
      error: string;
    };

export async function submitExam(
  examId: string,
  userAnswers: Record<string, string>,
): Promise<ExamSubmissionResult> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return { success: false, error: 'User profile not found' };
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });

  if (!exam) {
    return { success: false, error: 'Exam not found' };
  }

  let score = 0;
  let totalPoints = 0;
  const details: ExamQuestionDetail[] = [];

  for (const question of exam.questions) {
    totalPoints += question.points;
    const userAnswer = userAnswers[question.id] ?? null;
    const isCorrect = userAnswer !== null && userAnswer === question.correctAnswer;
    if (isCorrect) {
      score += question.points;
    }
    details.push({
      questionId: question.id,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
    });
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= exam.passingScore;

  // Persist submission
  try {
    await prisma.submission.create({
      data: {
        userId: user.id,
        examId: exam.id,
        score: percentage,
        passed,
        answers: userAnswers,
      },
    });
  } catch (error) {
    console.error('Failed to save submission:', error);
    return { success: false, error: 'Failed to save submission' };
  }

  return {
    success: true,
    score,
    totalPoints,
    percentage,
    passed,
    details,
  };
}
