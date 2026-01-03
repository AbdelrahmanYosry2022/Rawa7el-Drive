import { prisma } from '@rawa7el/database';
import type {
  CreateHalaqaInput,
  UpdateHalaqaInput,
  EnrollStudentInput,
  HalaqaWithDetails,
  HalaqaFilters,
  HalaqaSchedule,
} from '../types';

export class HalaqaService {
  /**
   * Create a new halaqa
   */
  async create(data: CreateHalaqaInput): Promise<HalaqaWithDetails> {
    return prisma.halaqa.create({
      data: {
        name: data.name,
        description: data.description,
        teacherId: data.teacherId,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        maxStudents: data.maxStudents ?? 20,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        students: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lessons: {
          include: { lesson: true },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
    });
  }

  /**
   * Get halaqa by ID
   */
  async getById(id: string): Promise<HalaqaWithDetails | null> {
    return prisma.halaqa.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lessons: {
          include: { lesson: true },
          orderBy: { lesson: { order: 'asc' } },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
    });
  }

  /**
   * Get all halaqat with filters
   */
  async getAll(filters?: HalaqaFilters): Promise<HalaqaWithDetails[]> {
    return prisma.halaqa.findMany({
      where: {
        ...(filters?.teacherId && { teacherId: filters.teacherId }),
        ...(filters?.day && { day: filters.day }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lessons: {
          include: { lesson: true },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update a halaqa
   */
  async update(id: string, data: UpdateHalaqaInput): Promise<HalaqaWithDetails> {
    return prisma.halaqa.update({
      where: { id },
      data,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        students: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lessons: {
          include: { lesson: true },
        },
      },
    });
  }

  /**
   * Delete a halaqa
   */
  async delete(id: string): Promise<void> {
    await prisma.halaqa.delete({
      where: { id },
    });
  }

  /**
   * Enroll a student in a halaqa
   */
  async enrollStudent(data: EnrollStudentInput) {
    const halaqa = await prisma.halaqa.findUnique({
      where: { id: data.halaqaId },
      include: { _count: { select: { students: true } } },
    });

    if (!halaqa) throw new Error('Halaqa not found');
    if (halaqa._count.students >= halaqa.maxStudents) {
      throw new Error('Halaqa is full');
    }

    return prisma.halaqaStudent.upsert({
      where: {
        halaqaId_studentId: {
          halaqaId: data.halaqaId,
          studentId: data.studentId,
        },
      },
      create: {
        halaqaId: data.halaqaId,
        studentId: data.studentId,
      },
      update: {
        isActive: true,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Remove a student from a halaqa
   */
  async removeStudent(halaqaId: string, studentId: string): Promise<void> {
    await prisma.halaqaStudent.update({
      where: {
        halaqaId_studentId: { halaqaId, studentId },
      },
      data: { isActive: false },
    });
  }

  /**
   * Get halaqat for a teacher
   */
  async getByTeacher(teacherId: string): Promise<HalaqaWithDetails[]> {
    return this.getAll({ teacherId, isActive: true });
  }

  /**
   * Get halaqat for a student
   */
  async getByStudent(studentId: string): Promise<HalaqaWithDetails[]> {
    const enrollments = await prisma.halaqaStudent.findMany({
      where: { studentId, isActive: true },
      select: { halaqaId: true },
    });

    const halaqaIds = enrollments.map((e: { halaqaId: string }) => e.halaqaId);

    return prisma.halaqa.findMany({
      where: { id: { in: halaqaIds } },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        students: {
          where: { isActive: true },
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        lessons: {
          include: { lesson: true },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
    });
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(): Promise<HalaqaSchedule[]> {
    const halaqat = await prisma.halaqa.findMany({
      where: { isActive: true },
      include: {
        teacher: {
          select: { name: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return halaqat.map((h: typeof halaqat[number]) => ({
      halaqaId: h.id,
      halaqaName: h.name,
      day: h.day,
      startTime: h.startTime,
      endTime: h.endTime,
      location: h.location,
      teacherName: h.teacher.name ?? 'Unknown',
      studentCount: h._count.students,
    }));
  }
}

export const halaqaService = new HalaqaService();
