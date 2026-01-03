import { prisma } from '@rawa7el/database';
import type {
  CreateSessionInput,
  RecordAttendanceInput,
  BulkAttendanceInput,
  SessionWithRecords,
  AttendanceStats,
  UserAttendanceReport,
  SessionFilters,
} from '../types';

export class AttendanceService {
  /**
   * Create a new attendance session
   */
  async createSession(data: CreateSessionInput): Promise<SessionWithRecords> {
    return prisma.attendanceSession.create({
      data: {
        title: data.title,
        date: data.date ?? new Date(),
        platform: data.platform ?? 'BEDAYA',
        halaqaId: data.halaqaId,
      },
      include: {
        records: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get session by ID with records
   */
  async getSessionById(id: string): Promise<SessionWithRecords | null> {
    return prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        records: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { records: true },
        },
      },
    });
  }

  /**
   * Get all sessions with filters
   */
  async getSessions(filters?: SessionFilters): Promise<SessionWithRecords[]> {
    return prisma.attendanceSession.findMany({
      where: {
        ...(filters?.platform && { platform: filters.platform }),
        ...(filters?.halaqaId && { halaqaId: filters.halaqaId }),
        ...(filters?.dateFrom && { date: { gte: filters.dateFrom } }),
        ...(filters?.dateTo && { date: { lte: filters.dateTo } }),
      },
      include: {
        records: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { records: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Record attendance for a user
   */
  async recordAttendance(data: RecordAttendanceInput) {
    return prisma.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId: data.sessionId,
          userId: data.userId,
        },
      },
      create: {
        sessionId: data.sessionId,
        userId: data.userId,
        status: data.status,
        notes: data.notes,
      },
      update: {
        status: data.status,
        notes: data.notes,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Record bulk attendance
   */
  async recordBulkAttendance(data: BulkAttendanceInput): Promise<number> {
    const operations = data.records.map((record) =>
      prisma.attendance.upsert({
        where: {
          sessionId_userId: {
            sessionId: data.sessionId,
            userId: record.userId,
          },
        },
        create: {
          sessionId: data.sessionId,
          userId: record.userId,
          status: record.status,
          notes: record.notes,
        },
        update: {
          status: record.status,
          notes: record.notes,
        },
      })
    );

    const results = await prisma.$transaction(operations);
    return results.length;
  }

  /**
   * Get attendance stats for a user
   */
  async getUserStats(userId: string, platform?: string): Promise<AttendanceStats> {
    const records = await prisma.attendance.findMany({
      where: {
        userId,
        ...(platform && {
          session: { platform: platform as 'BEDAYA' | 'TAHT_EL_ESHREEN' },
        }),
      },
      include: {
        session: true,
      },
    });

    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;

    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: totalSessions > 0 ? ((presentCount + lateCount) / totalSessions) * 100 : 0,
    };
  }

  /**
   * Get attendance report for all users in a session
   */
  async getSessionReport(sessionId: string): Promise<UserAttendanceReport[]> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');

    const reports: UserAttendanceReport[] = [];

    for (const record of session.records) {
      const stats = await this.getUserStats(record.userId);
      const userRecords = await prisma.attendance.findMany({
        where: { userId: record.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      reports.push({
        userId: record.userId,
        userName: record.user.name ?? record.user.email,
        stats,
        records: userRecords,
      });
    }

    return reports;
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    await prisma.attendanceSession.delete({
      where: { id },
    });
  }
}

export const attendanceService = new AttendanceService();
