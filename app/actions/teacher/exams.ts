'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return user;
}

export type CreateExamInput = {
  title: string;
  durationMinutes: number;
  passingScore: number;
};

export async function createExam(subjectId: string, data: CreateExamInput) {
  await requireAdmin();

  if (!data.title.trim()) {
    throw new Error('Title is required');
  }

  const duration = Number.isFinite(data.durationMinutes) ? data.durationMinutes : 30;
  const passingScore = Number.isFinite(data.passingScore) ? data.passingScore : 50;

  await prisma.exam.create({
    data: {
      title: data.title.trim(),
      subjectId,
      durationMinutes: duration,
      passingScore,
    },
  });

  revalidatePath(`/teacher/subjects/${subjectId}`);
}

export async function deleteExam(examId: string) {
  await requireAdmin();

  if (!examId) throw new Error('Exam id is required');

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return;

  await prisma.exam.delete({ where: { id: examId } });

  revalidatePath(`/teacher/subjects/${exam.subjectId}`);
}

export type AddQuestionInput = {
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options?: string[];
  correctAnswer: string;
  points: number;
};

export async function addQuestion(examId: string, data: AddQuestionInput) {
  await requireAdmin();

  if (!data.text.trim()) throw new Error('Question text is required');
  if (!data.correctAnswer) throw new Error('Correct answer is required');

  const points = Number.isFinite(data.points) && data.points > 0 ? data.points : 10;

  let optionsJson: string[] | null = null;

  if (data.type === 'MCQ') {
    const opts = (data.options || []).map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) throw new Error('At least two options are required');
    if (!opts.includes(data.correctAnswer)) {
      throw new Error('Correct answer must be one of the options');
    }
    optionsJson = opts;
  } else {
    // TRUE_FALSE
    optionsJson = ['صحيح', 'خطأ'];
    if (!optionsJson.includes(data.correctAnswer)) {
      throw new Error('Correct answer must be either صحيح or خطأ');
    }
  }

  await prisma.question.create({
    data: {
      examId,
      text: data.text.trim(),
      type: data.type,
      options: optionsJson,
      correctAnswer: data.correctAnswer,
      points,
    },
  });

  revalidatePath(`/teacher/exams/${examId}`);
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin();

  if (!questionId) throw new Error('Question id is required');

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return;

  await prisma.question.delete({ where: { id: questionId } });

  revalidatePath(`/teacher/exams/${question.examId}`);
}

export type UpdateExamInput = {
  title?: string;
  durationMinutes?: number;
  passingScore?: number;
};

export async function updateExam(examId: string, data: UpdateExamInput) {
  await requireAdmin();

  if (!examId) {
    throw new Error('Exam id is required');
  }

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) return;

  const updateData: any = {};

  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }
  if (data.durationMinutes !== undefined && Number.isFinite(data.durationMinutes)) {
    updateData.durationMinutes = data.durationMinutes;
  }
  if (data.passingScore !== undefined && Number.isFinite(data.passingScore)) {
    updateData.passingScore = data.passingScore;
  }

  await prisma.exam.update({
    where: { id: examId },
    data: updateData,
  });

  revalidatePath(`/teacher/subjects/${exam.subjectId}`);
  revalidatePath(`/teacher/exams/${examId}`);
}
