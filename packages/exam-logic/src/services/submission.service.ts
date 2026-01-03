import { prisma } from '@rawa7el/database';
import type { Submission } from '@rawa7el/database';
import type {
  StartExamInput,
  SubmitExamInput,
  ExamResult,
  QuestionResult,
  SubmissionFilters,
} from '../types';

export class SubmissionService {
  /**
   * Start an exam attempt
   */
  async startExam(data: StartExamInput): Promise<Submission> {
    const exam = await prisma.exam.findUnique({
      where: { id: data.examId },
      include: { _count: { select: { questions: true } } },
    });

    if (!exam) throw new Error('Exam not found');
    if (!exam.isPublished) throw new Error('Exam is not published');

    // Check max attempts
    const existingAttempts = await prisma.submission.count({
      where: {
        examId: data.examId,
        userId: data.userId,
      },
    });

    if (existingAttempts >= exam.maxAttempts) {
      throw new Error('Maximum attempts reached');
    }

    // Check for ongoing submission
    const ongoingSubmission = await prisma.submission.findFirst({
      where: {
        examId: data.examId,
        userId: data.userId,
        status: 'ONGOING',
      },
    });

    if (ongoingSubmission) {
      return ongoingSubmission;
    }

    return prisma.submission.create({
      data: {
        examId: data.examId,
        userId: data.userId,
        answers: {},
        passed: false,
        attemptNumber: existingAttempts + 1,
      },
    });
  }

  /**
   * Save answer for a question (auto-save)
   */
  async saveAnswer(
    submissionId: string,
    questionId: string,
    answer: string
  ): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'ONGOING') throw new Error('Submission already completed');

    const answers = (submission.answers as Record<string, string>) || {};
    answers[questionId] = answer;

    return prisma.submission.update({
      where: { id: submissionId },
      data: { answers },
    });
  }

  /**
   * Submit exam and calculate score
   */
  async submitExam(data: SubmitExamInput): Promise<ExamResult> {
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: {
        exam: {
          include: { questions: true },
        },
      },
    });

    if (!submission) throw new Error('Submission not found');
    if (submission.status !== 'ONGOING') throw new Error('Submission already completed');

    const { exam } = submission;
    const answers = { ...(submission.answers as Record<string, string>), ...data.answers };

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const details: QuestionResult[] = [];

    for (const question of exam.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id] || '';
      const isCorrect = this.checkAnswer(userAnswer, question.correctAnswer, question.type);
      const pointsEarned = isCorrect ? question.points : 0;
      earnedPoints += pointsEarned;

      details.push({
        questionId: question.id,
        questionText: question.text,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: pointsEarned,
        explanation: question.explanation ?? undefined,
      });
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= exam.passingScore;

    const updatedSubmission = await prisma.submission.update({
      where: { id: data.submissionId },
      data: {
        answers,
        score: earnedPoints,
        percentage,
        passed,
        status: 'COMPLETED',
        submittedAt: new Date(),
      },
    });

    return {
      submission: updatedSubmission,
      exam,
      score: earnedPoints,
      percentage,
      passed,
      correctAnswers: details.filter((d) => d.isCorrect).length,
      totalQuestions: exam.questions.length,
      details: exam.showResults ? details : undefined,
    };
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(userAnswer: string, correctAnswer: string, type: string): boolean {
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    if (type === 'TRUE_FALSE' || type === 'MCQ') {
      return normalizedUser === normalizedCorrect;
    }

    // For short answer, allow some flexibility
    return normalizedUser === normalizedCorrect;
  }

  /**
   * Get submission by ID
   */
  async getById(id: string): Promise<Submission | null> {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        exam: {
          include: { questions: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get submissions with filters
   */
  async getAll(filters?: SubmissionFilters): Promise<Submission[]> {
    return prisma.submission.findMany({
      where: {
        ...(filters?.examId && { examId: filters.examId }),
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.passed !== undefined && { passed: filters.passed }),
      },
      include: {
        exam: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's submissions for an exam
   */
  async getUserExamSubmissions(userId: string, examId: string): Promise<Submission[]> {
    return prisma.submission.findMany({
      where: { userId, examId },
      orderBy: { attemptNumber: 'desc' },
    });
  }

  /**
   * Check if user can attempt exam
   */
  async canAttempt(userId: string, examId: string): Promise<{ canAttempt: boolean; reason?: string }> {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) return { canAttempt: false, reason: 'Exam not found' };
    if (!exam.isPublished) return { canAttempt: false, reason: 'Exam is not published' };

    const attempts = await prisma.submission.count({
      where: { userId, examId },
    });

    if (attempts >= exam.maxAttempts) {
      return { canAttempt: false, reason: 'Maximum attempts reached' };
    }

    const ongoingAttempt = await prisma.submission.findFirst({
      where: { userId, examId, status: 'ONGOING' },
    });

    if (ongoingAttempt) {
      return { canAttempt: true, reason: 'Ongoing attempt exists' };
    }

    return { canAttempt: true };
  }
}

export const submissionService = new SubmissionService();
