'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitExam(examId: string, userAnswers: Record<string, string>) {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Get user from DB using clerkId
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    // In a real app, you might sync the user here via webhook, 
    // but for now we assume the user exists.
    return { error: 'User profile not found' };
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });

  if (!exam) {
    return { error: 'Exam not found' };
  }

  let score = 0;
  let totalPoints = 0;

  // Calculate score
  exam.questions.forEach((question) => {
    totalPoints += question.points;
    const userAnswer = userAnswers[question.id];

    // Simple string comparison for now. 
    // For production, trim strings or handle case sensitivity if needed.
    if (userAnswer === question.correctAnswer) {
      score += question.points;
    }
  });

  const passed = score >= exam.passingScore;

  // Save submission
  try {
    const submission = await prisma.examSubmission.create({
      data: {
        userId: user.id,
        examId: exam.id,
        score,
        passed,
        answers: userAnswers,
      },
    });

    revalidatePath(`/courses/${exam.courseId}`);

    return {
      success: true,
      score,
      totalPoints,
      passed,
      submissionId: submission.id,
    };
  } catch (error) {
    console.error('Failed to save submission:', error);
    return { error: 'Failed to save submission' };
  }
}
