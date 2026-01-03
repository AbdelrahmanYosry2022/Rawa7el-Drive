import { prisma } from '@rawa7el/database';
import type { StudentEvaluation } from '@rawa7el/database';
import type { CreateEvaluationInput, StudentProgress } from '../types';

export class EvaluationService {
  /**
   * Create a student evaluation
   */
  async create(data: CreateEvaluationInput): Promise<StudentEvaluation> {
    return prisma.studentEvaluation.create({
      data: {
        studentId: data.studentId,
        halaqaId: data.halaqaId,
        score: data.score,
        notes: data.notes,
        criteria: data.criteria,
        period: data.period,
      },
    });
  }

  /**
   * Get evaluations for a student
   */
  async getByStudent(studentId: string): Promise<StudentEvaluation[]> {
    return prisma.studentEvaluation.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get evaluations for a halaqa
   */
  async getByHalaqa(halaqaId: string): Promise<StudentEvaluation[]> {
    return prisma.studentEvaluation.findMany({
      where: { halaqaId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get student progress in a halaqa
   */
  async getStudentProgress(studentId: string, halaqaId: string): Promise<StudentProgress> {
    const [student, halaqa, evaluations, completedLessons] = await Promise.all([
      prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, name: true },
      }),
      prisma.halaqa.findUnique({
        where: { id: halaqaId },
        include: {
          _count: { select: { lessons: true } },
        },
      }),
      prisma.studentEvaluation.findMany({
        where: { studentId, halaqaId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.halaqaLesson.count({
        where: {
          halaqaId,
          completedAt: { not: null },
        },
      }),
    ]);

    if (!student || !halaqa) throw new Error('Student or Halaqa not found');

    const totalLessons = halaqa._count.lessons;
    const averageScore =
      evaluations.length > 0
        ? evaluations.reduce((sum: number, e: { score: number }) => sum + e.score, 0) / evaluations.length
        : 0;

    return {
      studentId: student.id,
      studentName: student.name ?? 'Unknown',
      halaqaId: halaqa.id,
      halaqaName: halaqa.name,
      completedLessons,
      totalLessons,
      progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      averageScore,
      evaluations,
    };
  }

  /**
   * Update an evaluation
   */
  async update(
    id: string,
    data: Partial<Omit<CreateEvaluationInput, 'studentId' | 'halaqaId'>>
  ): Promise<StudentEvaluation> {
    return prisma.studentEvaluation.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an evaluation
   */
  async delete(id: string): Promise<void> {
    await prisma.studentEvaluation.delete({
      where: { id },
    });
  }
}

export const evaluationService = new EvaluationService();
