import { prisma } from '@rawa7el/database';
import type { Lesson, HalaqaLesson } from '@rawa7el/database';
import type { CreateLessonInput, AssignLessonInput, HalaqaLessonWithDetails } from '../types';

export class LessonService {
  /**
   * Create a new lesson
   */
  async create(data: CreateLessonInput): Promise<Lesson> {
    return prisma.lesson.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        subjectId: data.subjectId,
        order: data.order ?? 0,
      },
    });
  }

  /**
   * Get lesson by ID
   */
  async getById(id: string): Promise<Lesson | null> {
    return prisma.lesson.findUnique({
      where: { id },
    });
  }

  /**
   * Get all lessons for a subject
   */
  async getBySubject(subjectId: string): Promise<Lesson[]> {
    return prisma.lesson.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Update a lesson
   */
  async update(id: string, data: Partial<CreateLessonInput>): Promise<Lesson> {
    return prisma.lesson.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a lesson
   */
  async delete(id: string): Promise<void> {
    await prisma.lesson.delete({
      where: { id },
    });
  }

  /**
   * Assign a lesson to a halaqa
   */
  async assignToHalaqa(data: AssignLessonInput): Promise<HalaqaLessonWithDetails> {
    return prisma.halaqaLesson.upsert({
      where: {
        halaqaId_lessonId: {
          halaqaId: data.halaqaId,
          lessonId: data.lessonId,
        },
      },
      create: {
        halaqaId: data.halaqaId,
        lessonId: data.lessonId,
        scheduledAt: data.scheduledAt,
      },
      update: {
        scheduledAt: data.scheduledAt,
      },
      include: {
        lesson: true,
      },
    });
  }

  /**
   * Mark a lesson as completed for a halaqa
   */
  async markCompleted(halaqaId: string, lessonId: string, notes?: string): Promise<HalaqaLesson> {
    return prisma.halaqaLesson.update({
      where: {
        halaqaId_lessonId: { halaqaId, lessonId },
      },
      data: {
        completedAt: new Date(),
        notes,
      },
    });
  }

  /**
   * Get lessons for a halaqa
   */
  async getHalaqaLessons(halaqaId: string): Promise<HalaqaLessonWithDetails[]> {
    return prisma.halaqaLesson.findMany({
      where: { halaqaId },
      include: {
        lesson: true,
      },
      orderBy: { lesson: { order: 'asc' } },
    });
  }

  /**
   * Remove a lesson from a halaqa
   */
  async removeFromHalaqa(halaqaId: string, lessonId: string): Promise<void> {
    await prisma.halaqaLesson.delete({
      where: {
        halaqaId_lessonId: { halaqaId, lessonId },
      },
    });
  }

  /**
   * Reorder lessons
   */
  async reorder(subjectId: string, lessonIds: string[]): Promise<void> {
    await prisma.$transaction(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  }
}

export const lessonService = new LessonService();
