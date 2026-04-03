/**
 * Pure utility functions for attendance status determination and session validation.
 * These functions have NO dependencies on Prisma, Supabase, or any ORM.
 * They can be used in any context (API routes, frontend, edge functions).
 */

export type AttendanceStatusResult = 'PRESENT' | 'LATE' | 'ABSENT';

export interface SessionValidationResult {
  valid: boolean;
  reason?: string;
  /** Arabic user-facing message */
  message?: string;
}

export interface AttendanceStatusInput {
  /** The scheduled start time of the session (ISO string or Date) */
  sessionStartTime: string | Date;
  /** The time the student is checking in (ISO string or Date) */
  checkInTime: string | Date;
  /** Minutes after start time before a student is marked LATE (default: 15) */
  lateThresholdMinutes?: number;
}

export interface SessionForValidation {
  id: string;
  isActive: boolean | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  endedAt?: string | null;
  maxDurationMinutes?: number | null;
  createdAt: string;
}

/**
 * Determine whether a check-in should be marked as PRESENT or LATE
 * based on the session start time and the configured threshold.
 *
 * @returns 'PRESENT' if on time, 'LATE' if past threshold
 */
export function determineAttendanceStatus(input: AttendanceStatusInput): AttendanceStatusResult {
  const threshold = input.lateThresholdMinutes ?? 15;
  const sessionStart = new Date(input.sessionStartTime).getTime();
  const checkIn = new Date(input.checkInTime).getTime();

  if (isNaN(sessionStart) || isNaN(checkIn)) {
    // If we can't parse dates, default to PRESENT to avoid false negatives
    return 'PRESENT';
  }

  const diffMinutes = (checkIn - sessionStart) / (1000 * 60);

  // If checking in before the session starts or within the threshold, mark as PRESENT
  if (diffMinutes <= threshold) {
    return 'PRESENT';
  }

  return 'LATE';
}

/**
 * Validate whether a session can accept check-ins right now.
 *
 * Checks performed:
 * 1. Session must exist (caller is responsible for passing a non-null session)
 * 2. Session must be active (isActive = true)
 * 3. Session must not be manually ended (endedAt must be null)
 * 4. Session must not have exceeded maxDurationMinutes from createdAt
 * 5. Session date should match today (optional — a session created yesterday
 *    should probably not accept check-ins today)
 */
export function validateSessionForCheckIn(
  session: SessionForValidation,
  now: Date = new Date()
): SessionValidationResult {
  // Check 1: Session must be active
  // If isActive is null, it means the column hasn't been migrated yet — allow check-in for backward compat
  if (session.isActive === false) {
    // Check if endedAt is set (session was manually ended)
    if (session.endedAt) {
      return {
        valid: false,
        reason: 'session_ended',
        message: 'تم إنهاء هذه الجلسة',
      };
    }
    return {
      valid: false,
      reason: 'session_inactive',
      message: 'جلسة الحضور غير نشطة',
    };
  }

  // Check 2: Session must not have exceeded max duration
  if (session.maxDurationMinutes) {
    const createdAt = new Date(session.createdAt).getTime();
    const maxEnd = createdAt + session.maxDurationMinutes * 60 * 1000;
    if (now.getTime() > maxEnd) {
      return {
        valid: false,
        reason: 'session_expired',
        message: 'انتهت صلاحية هذه الجلسة',
      };
    }
  }

  // Check 3: Session date should be today (with some tolerance)
  // Allow sessions from the same calendar day
  const sessionDate = new Date(session.date);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Only enforce date check if we have a valid date
  if (!isNaN(sessionDate.getTime())) {
    const sessionDateNormalized = new Date(sessionDate);
    sessionDateNormalized.setHours(0, 0, 0, 0);
    const todayNormalized = new Date(todayStart);

    // Allow yesterday's sessions too (in case a session started late at night)
    const yesterdayNormalized = new Date(todayNormalized);
    yesterdayNormalized.setDate(yesterdayNormalized.getDate() - 1);

    if (sessionDateNormalized < yesterdayNormalized) {
      return {
        valid: false,
        reason: 'session_old',
        message: 'جلسة الحضور قديمة ولا يمكن التسجيل فيها',
      };
    }
  }

  return { valid: true };
}

/**
 * Get the effective start time for a session.
 * Priority: startTime > createdAt
 */
export function getSessionStartTime(session: {
  startTime?: string | null;
  createdAt: string;
}): Date {
  if (session.startTime) {
    const parsed = new Date(session.startTime);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date(session.createdAt);
}
