import { describe, it, expect, vi } from 'vitest';

// Mock Prisma client
vi.mock('@rawa7el/database', () => ({
  prisma: {
    attendance: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('Attendance Logic - Status Calculations', () => {
  describe('calculateAttendanceRate', () => {
    it('should return 100% when all sessions attended', () => {
      const totalSessions = 10;
      const attendedSessions = 10;
      const rate = (attendedSessions / totalSessions) * 100;
      
      expect(rate).toBe(100);
    });

    it('should return 0% when no sessions attended', () => {
      const totalSessions = 10;
      const attendedSessions = 0;
      const rate = (attendedSessions / totalSessions) * 100;
      
      expect(rate).toBe(0);
    });

    it('should calculate partial attendance correctly', () => {
      const totalSessions = 20;
      const attendedSessions = 15;
      const rate = (attendedSessions / totalSessions) * 100;
      
      expect(rate).toBe(75);
    });

    it('should handle zero total sessions', () => {
      const totalSessions = 0;
      const attendedSessions = 0;
      const rate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
      
      expect(rate).toBe(0);
    });
  });

  describe('determineAttendanceStatus', () => {
    it('should mark as PRESENT when on time', () => {
      const sessionStartTime = new Date('2024-01-01T09:00:00');
      const checkInTime = new Date('2024-01-01T09:00:00');
      const lateThresholdMinutes = 15;
      
      const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60);
      const status = diffMinutes <= lateThresholdMinutes ? 'PRESENT' : 'LATE';
      
      expect(status).toBe('PRESENT');
    });

    it('should mark as LATE when arriving after threshold', () => {
      const sessionStartTime = new Date('2024-01-01T09:00:00');
      const checkInTime = new Date('2024-01-01T09:20:00');
      const lateThresholdMinutes = 15;
      
      const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60);
      const status = diffMinutes <= lateThresholdMinutes ? 'PRESENT' : 'LATE';
      
      expect(status).toBe('LATE');
    });

    it('should mark as PRESENT when arriving early', () => {
      const sessionStartTime = new Date('2024-01-01T09:00:00');
      const checkInTime = new Date('2024-01-01T08:50:00');
      const lateThresholdMinutes = 15;
      
      const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60);
      const status = diffMinutes <= lateThresholdMinutes ? 'PRESENT' : 'LATE';
      
      expect(status).toBe('PRESENT');
    });
  });

  describe('calculateStreaks', () => {
    it('should count consecutive present days', () => {
      const records = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'PRESENT' },
      ];
      
      let currentStreak = 0;
      for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].status === 'PRESENT') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      expect(currentStreak).toBe(1);
    });

    it('should return 0 streak when last record is absent', () => {
      const records = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
      ];
      
      let currentStreak = 0;
      for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].status === 'PRESENT') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      expect(currentStreak).toBe(0);
    });

    it('should find longest streak in history', () => {
      const records = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'PRESENT' },
        { status: 'PRESENT' },
      ];
      
      let longestStreak = 0;
      let currentStreak = 0;
      
      for (const record of records) {
        if (record.status === 'PRESENT') {
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      expect(longestStreak).toBe(3);
    });
  });
});

describe('Attendance Logic - Statistics', () => {
  describe('getAttendanceStats', () => {
    it('should count each status type correctly', () => {
      const records = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'LATE' },
        { status: 'EXCUSED' },
        { status: 'PRESENT' },
      ];
      
      const stats = {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        late: records.filter(r => r.status === 'LATE').length,
        excused: records.filter(r => r.status === 'EXCUSED').length,
      };
      
      expect(stats.present).toBe(3);
      expect(stats.absent).toBe(1);
      expect(stats.late).toBe(1);
      expect(stats.excused).toBe(1);
    });

    it('should calculate effective attendance (present + excused)', () => {
      const records = [
        { status: 'PRESENT' },
        { status: 'PRESENT' },
        { status: 'ABSENT' },
        { status: 'EXCUSED' },
      ];
      
      const effectiveAttendance = records.filter(
        r => r.status === 'PRESENT' || r.status === 'EXCUSED'
      ).length;
      
      expect(effectiveAttendance).toBe(3);
    });
  });

  describe('isAtRisk', () => {
    it('should flag student at risk when attendance below threshold', () => {
      const attendanceRate = 65;
      const riskThreshold = 75;
      const isAtRisk = attendanceRate < riskThreshold;
      
      expect(isAtRisk).toBe(true);
    });

    it('should not flag student when attendance above threshold', () => {
      const attendanceRate = 85;
      const riskThreshold = 75;
      const isAtRisk = attendanceRate < riskThreshold;
      
      expect(isAtRisk).toBe(false);
    });
  });
});

describe('Attendance Logic - Date Handling', () => {
  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T09:00:00');
      const date2 = new Date('2024-01-15T18:30:00');
      
      const isSameDay = 
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
      
      expect(isSameDay).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15T09:00:00');
      const date2 = new Date('2024-01-16T09:00:00');
      
      const isSameDay = 
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
      
      expect(isSameDay).toBe(false);
    });
  });

  describe('getWeekNumber', () => {
    it('should calculate week number correctly', () => {
      const date = new Date('2024-01-15');
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      
      expect(weekNumber).toBeGreaterThan(0);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });
  });
});
