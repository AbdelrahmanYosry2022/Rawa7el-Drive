import type { 
  Halaqa, 
  HalaqaStudent, 
  HalaqaLesson, 
  Lesson, 
  StudentEvaluation,
  HalaqaDay 
} from '@rawa7el/database';

// ==================== Input Types ====================

export interface CreateHalaqaInput {
  name: string;
  description?: string;
  teacherId: string;
  day: HalaqaDay;
  startTime: string;
  endTime: string;
  location?: string;
  maxStudents?: number;
}

export interface UpdateHalaqaInput extends Partial<Omit<CreateHalaqaInput, 'teacherId'>> {
  isActive?: boolean;
}

export interface EnrollStudentInput {
  halaqaId: string;
  studentId: string;
}

export interface CreateLessonInput {
  title: string;
  description?: string;
  content?: string;
  subjectId: string;
  order?: number;
}

export interface AssignLessonInput {
  halaqaId: string;
  lessonId: string;
  scheduledAt?: Date;
}

export interface CreateEvaluationInput {
  studentId: string;
  halaqaId: string;
  score: number;
  notes?: string;
  criteria?: {
    attendance?: number;
    participation?: number;
    memorization?: number;
    behavior?: number;
  };
  period?: string;
}

// ==================== Output Types ====================

export interface HalaqaWithDetails extends Halaqa {
  teacher: {
    id: string;
    name: string | null;
    email: string;
  };
  students: HalaqaStudentWithUser[];
  lessons: HalaqaLessonWithDetails[];
  _count?: {
    students: number;
    lessons: number;
  };
}

export interface HalaqaStudentWithUser extends HalaqaStudent {
  student: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface HalaqaLessonWithDetails extends HalaqaLesson {
  lesson: Lesson;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  halaqaId: string;
  halaqaName: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  averageScore: number;
  evaluations: StudentEvaluation[];
}

export interface HalaqaSchedule {
  halaqaId: string;
  halaqaName: string;
  day: HalaqaDay;
  startTime: string;
  endTime: string;
  location: string | null;
  teacherName: string;
  studentCount: number;
}

// ==================== Filter Types ====================

export interface HalaqaFilters {
  teacherId?: string;
  day?: HalaqaDay;
  isActive?: boolean;
  search?: string;
}

// ==================== Re-exports ====================

export type { Halaqa, HalaqaStudent, HalaqaLesson, Lesson, StudentEvaluation, HalaqaDay };
