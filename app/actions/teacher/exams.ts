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
    const opts = (data.options || []).map((o: string) => o.trim()).filter(Boolean);
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

// Bulk import questions from JSON
export async function addQuestionsBulk(examId: string, questionsJson: string) {
  await requireAdmin();

  if (!examId) {
    throw new Error('Exam id is required');
  }

  try {
    const questions = JSON.parse(questionsJson);

    if (!Array.isArray(questions)) {
      throw new Error('Invalid format: Expected an array of questions');
    }

    if (questions.length === 0) {
      throw new Error('No questions found in the JSON');
    }

    // Validate and create questions in a transaction
    const createdQuestions = await prisma.$transaction(
      questions.map((q: any) => {
        // Validate required fields
        if (!q.text || typeof q.text !== 'string') {
          throw new Error('Each question must have a "text" field');
        }
        if (!q.type || (q.type !== 'MCQ' && q.type !== 'TRUE_FALSE')) {
          throw new Error('Each question must have a valid "type" (MCQ or TRUE_FALSE)');
        }
        if (!q.correctAnswer) {
          throw new Error('Each question must have a "correctAnswer" field');
        }

        const points = Number.isFinite(q.points) && q.points > 0 ? q.points : 10;
        let optionsJson: string[] = [];

        if (q.type === 'MCQ') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            throw new Error('MCQ questions must have at least 2 options');
          }
          optionsJson = q.options.map((o: any) => String(o).trim()).filter(Boolean);
          if (!optionsJson.includes(q.correctAnswer)) {
            throw new Error(`Correct answer "${q.correctAnswer}" must be one of the options`);
          }
        } else {
          // TRUE_FALSE
          optionsJson = ['صحيح', 'خطأ'];
          if (!optionsJson.includes(q.correctAnswer)) {
            throw new Error('TRUE_FALSE correct answer must be either "صحيح" or "خطأ"');
          }
        }

        return prisma.question.create({
          data: {
            examId,
            text: q.text.trim(),
            type: q.type,
            options: optionsJson,
            correctAnswer: q.correctAnswer,
            points,
          },
        });
      })
    );

    revalidatePath(`/teacher/exams/${examId}`);
    return { success: true, count: createdQuestions.length };
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to import questions. Check JSON format.' 
    };
  }
}
