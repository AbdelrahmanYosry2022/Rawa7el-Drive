import type { Attendance, AttendanceSession, AttendanceStatus, Platform } from '@rawa7el/database';

// ==================== Input Types ====================

export interface CreateSessionInput {
  title?: string;
  date?: Date;
  platform?: Platform;
  halaqaId?: string;
}

export interface RecordAttendanceInput {
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceInput {
  sessionId: string;
  records: {
    userId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

// ==================== Output Types ====================

export interface SessionWithRecords extends AttendanceSession {
  records: AttendanceWithUser[];
  _count?: {
    records: number;
  };
}

export interface AttendanceWithUser extends Attendance {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export interface UserAttendanceReport {
  userId: string;
  userName: string;
  stats: AttendanceStats;
  records: Attendance[];
}

// ==================== Filter Types ====================

export interface SessionFilters {
  platform?: Platform;
  halaqaId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AttendanceFilters {
  sessionId?: string;
  userId?: string;
  status?: AttendanceStatus;
}

// ==================== Re-exports ====================

export type { Attendance, AttendanceSession, AttendanceStatus, Platform };
