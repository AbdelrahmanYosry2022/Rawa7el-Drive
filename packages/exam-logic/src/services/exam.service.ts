import { prisma } from '@rawa7el/database';
import type {
  CreateExamInput,
  UpdateExamInput,
  ExamWithQuestions,
  ExamFilters,
  ExamStats,
} from '../types';

export class ExamService {
  /**
   * Create a new exam
   */
  async create(data: CreateExamInput): Promise<ExamWithQuestions> {
    return prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        passingScore: data.passingScore ?? 50,
        durationMinutes: data.durationMinutes ?? 30,
        timerMode: data.timerMode ?? 'EXAM_TOTAL',
        questionTimeSeconds: data.questionTimeSeconds,
        shuffleQuestions: data.shuffleQuestions ?? false,
        shuffleOptions: data.shuffleOptions ?? false,
        showResults: data.showResults ?? true,
        maxAttempts: data.maxAttempts ?? 1,
      },
      include: {
        questions: true,
      },
    });
  }

  /**
   * Get exam by ID with questions
   */
  async getById(id: string): Promise<ExamWithQuestions | null> {
    return prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
    });
  }

  /**
   * Get all exams with optional filters
   */
  async getAll(filters?: ExamFilters): Promise<ExamWithQuestions[]> {
    return prisma.exam.findMany({
      where: {
        ...(filters?.subjectId && { subjectId: filters.subjectId }),
        ...(filters?.isPublished !== undefined && { isPublished: filters.isPublished }),
        ...(filters?.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            questions: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update an exam
   */
  async update(id: string, data: UpdateExamInput): Promise<ExamWithQuestions> {
    return prisma.exam.update({
      where: { id },
      data,
      include: {
        questions: true,
      },
    });
  }

  /**
   * Delete an exam
   */
  async delete(id: string): Promise<void> {
    await prisma.exam.delete({
      where: { id },
    });
  }

  /**
   * Publish/unpublish an exam
   */
  async togglePublish(id: string): Promise<ExamWithQuestions> {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new Error('Exam not found');

    return prisma.exam.update({
      where: { id },
      data: { isPublished: !exam.isPublished },
      include: { questions: true },
    });
  }

  /**
   * Get exam statistics
   */
  async getStats(examId: string): Promise<ExamStats> {
    const submissions = await prisma.submission.findMany({
      where: {
        examId,
        status: 'COMPLETED',
      },
      select: {
        score: true,
        passed: true,
      },
    });

    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const scores = submissions.map((s: { score: number | null }) => s.score ?? 0);
    const passedCount = submissions.filter((s: { passed: boolean | null }) => s.passed).length;

    return {
      totalSubmissions: submissions.length,
      averageScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length,
      passRate: (passedCount / submissions.length) * 100,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };
  }

  /**
   * Duplicate an exam
   */
  async duplicate(id: string, newTitle?: string): Promise<ExamWithQuestions> {
    const exam = await this.getById(id);
    if (!exam) throw new Error('Exam not found');

    return prisma.exam.create({
      data: {
        title: newTitle ?? `${exam.title} (Copy)`,
        description: exam.description,
        subjectId: exam.subjectId,
        passingScore: exam.passingScore,
        durationMinutes: exam.durationMinutes,
        timerMode: exam.timerMode,
        questionTimeSeconds: exam.questionTimeSeconds,
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        showResults: exam.showResults,
        maxAttempts: exam.maxAttempts,
        isPublished: false,
        questions: {
          create: exam.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points,
            timeSeconds: q.timeSeconds,
            order: q.order,
          })),
        },
      },
      include: { questions: true },
    });
  }
}

export const examService = new ExamService();
