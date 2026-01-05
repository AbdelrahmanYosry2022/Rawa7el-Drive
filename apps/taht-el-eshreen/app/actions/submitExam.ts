'use server';

import { createServerClient } from '@rawa7el/supabase';

export type ExamQuestionDetail = {
  questionId: string;
  text: string;
  options: string[];
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};

export type ExamSubmissionResult =
  | {
      success: true;
      score: number; // raw points
      totalPoints: number;
      percentage: number;
      passed: boolean;
      details: ExamQuestionDetail[];
    }
  | {
      success: false;
      error: string;
    };

export async function submitExam(
  examId: string,
  userAnswers: Record<string, string>,
): Promise<ExamSubmissionResult> {
  const supabase = await createServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: userData } = await supabase
    .from('User')
    .select('*')
    .eq('id', authUser.id)
    .single();

  const user = userData as any;
  if (!user) {
    return { success: false, error: 'User profile not found' };
  }

  const { data: examData } = await supabase
    .from('Exam')
    .select('*')
    .eq('id', examId)
    .single();

  const exam = examData as any;
  if (!exam) {
    return { success: false, error: 'Exam not found' };
  }

  const { data: questionsData } = await supabase
    .from('Question')
    .select('*')
    .eq('examId', examId);

  const questions = questionsData as any[];
  if (!questions) {
    return { success: false, error: 'Questions not found' };
  }

  const examWithQuestions = { ...exam, questions };

  let score = 0;
  let totalPoints = 0;
  const details: ExamQuestionDetail[] = [];

  for (const question of examWithQuestions.questions) {
    totalPoints += question.points;
    const userAnswer = userAnswers[question.id] ?? null;
    const isCorrect = userAnswer !== null && userAnswer === question.correctAnswer;
    if (isCorrect) {
      score += question.points;
    }
    
    // Parse options from JSON
    let options: string[] = [];
    try {
      if (question.options && typeof question.options === 'object') {
        options = question.options as string[];
      }
    } catch (e) {
      options = [];
    }
    
    details.push({
      questionId: question.id,
      text: question.text,
      options,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
    });
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= exam.passingScore;

  // Persist submission using existing ONGOING session when available
  try {
    const { data: existingData } = await supabase
      .from('Submission')
      .select('*')
      .eq('userId', user.id)
      .eq('examId', exam.id)
      .eq('status', 'ONGOING')
      .order('startedAt', { ascending: false })
      .limit(1)
      .single();

    const existing = existingData as any;
    const now = new Date();

    if (existing) {
      const startedAt = new Date(existing.startedAt);
      const deadline = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);

      if (now > deadline) {
        // Mark as completed with failing score if submitted after time
        await (supabase as any)
          .from('Submission')
          .update({
            status: 'COMPLETED',
            score: 0,
            passed: false,
            answers: userAnswers,
          })
          .eq('id', existing.id);

        return {
          success: false,
          error: 'انتهى وقت الاختبار، لا يمكن إرسال الإجابات بعد انتهاء المدة.',
        };
      }

      await (supabase as any)
        .from('Submission')
        .update({
          status: 'COMPLETED',
          score: percentage,
          passed,
          answers: userAnswers,
        })
        .eq('id', existing.id);
    } else {
      await (supabase as any)
        .from('Submission')
        .insert({
          id: crypto.randomUUID(),
          userId: user.id,
          examId: exam.id,
          score: percentage,
          passed,
          status: 'COMPLETED',
          answers: userAnswers,
          startedAt: now.toISOString(),
        });
    }
  } catch (error) {
    console.error('Failed to save submission:', error);
    return { success: false, error: 'Failed to save submission' };
  }

  return {
    success: true,
    score,
    totalPoints,
    percentage,
    passed,
    details,
  };
}
