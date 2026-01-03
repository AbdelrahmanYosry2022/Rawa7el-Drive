import type { Exam, Question, Submission, QuestionType, TimerMode, SubmissionStatus } from '@rawa7el/database';

// ==================== Input Types ====================

export interface CreateExamInput {
  title: string;
  description?: string;
  subjectId: string;
  passingScore?: number;
  durationMinutes?: number;
  timerMode?: TimerMode;
  questionTimeSeconds?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  maxAttempts?: number;
}

export interface UpdateExamInput extends Partial<CreateExamInput> {
  isPublished?: boolean;
}

export interface CreateQuestionInput {
  examId: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  timeSeconds?: number;
  order?: number;
}

export interface UpdateQuestionInput extends Partial<Omit<CreateQuestionInput, 'examId'>> {}

export interface StartExamInput {
  examId: string;
  userId: string;
}

export interface SubmitAnswerInput {
  submissionId: string;
  questionId: string;
  answer: string;
}

export interface SubmitExamInput {
  submissionId: string;
  answers: Record<string, string>;
}

// ==================== Output Types ====================

export interface ExamWithQuestions extends Exam {
  questions: Question[];
  _count?: {
    questions: number;
    submissions: number;
  };
}

export interface ExamResult {
  submission: Submission;
  exam: Exam;
  score: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  details?: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
  explanation?: string;
}

export interface ExamStats {
  totalSubmissions: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
}

// ==================== Filter Types ====================

export interface ExamFilters {
  subjectId?: string;
  isPublished?: boolean;
  search?: string;
}

export interface SubmissionFilters {
  examId?: string;
  userId?: string;
  status?: SubmissionStatus;
  passed?: boolean;
}

// ==================== Re-exports ====================

export type { Exam, Question, Submission, QuestionType, TimerMode, SubmissionStatus };
