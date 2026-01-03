import { prisma } from '@rawa7el/database';
import type { Question } from '@rawa7el/database';
import type { CreateQuestionInput, UpdateQuestionInput } from '../types';

export class QuestionService {
  /**
   * Create a new question
   */
  async create(data: CreateQuestionInput): Promise<Question> {
    return prisma.question.create({
      data: {
        examId: data.examId,
        text: data.text,
        type: data.type,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        points: data.points ?? 1,
        timeSeconds: data.timeSeconds,
        order: data.order ?? 0,
      },
    });
  }

  /**
   * Create multiple questions at once
   */
  async createMany(questions: CreateQuestionInput[]): Promise<number> {
    const result = await prisma.question.createMany({
      data: questions.map((q) => ({
        examId: q.examId,
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points ?? 1,
        timeSeconds: q.timeSeconds,
        order: q.order ?? 0,
      })),
    });
    return result.count;
  }

  /**
   * Get question by ID
   */
  async getById(id: string): Promise<Question | null> {
    return prisma.question.findUnique({
      where: { id },
    });
  }

  /**
   * Get all questions for an exam
   */
  async getByExamId(examId: string): Promise<Question[]> {
    return prisma.question.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Update a question
   */
  async update(id: string, data: UpdateQuestionInput): Promise<Question> {
    return prisma.question.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a question
   */
  async delete(id: string): Promise<void> {
    await prisma.question.delete({
      where: { id },
    });
  }

  /**
   * Reorder questions
   */
  async reorder(examId: string, questionIds: string[]): Promise<void> {
    await prisma.$transaction(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  }

  /**
   * Shuffle questions for an exam attempt
   */
  shuffleQuestions(questions: Question[]): Question[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Shuffle options for MCQ questions
   */
  shuffleOptions(question: Question): Question {
    if (question.type !== 'MCQ' || !question.options) return question;

    const options = question.options as string[];
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      ...question,
      options: shuffled,
    };
  }
}

export const questionService = new QuestionService();
