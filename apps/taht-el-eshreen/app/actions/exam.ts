'use server';

import { createServerClient } from '@rawa7el/supabase';

export type StartExamSessionResult =
  | { success: true; startedAt: string }
  | { success: false; error: string };

export async function startExamSession(examId: string): Promise<StartExamSessionResult> {
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

  // Check for existing ongoing submission
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
  if (existing) {
    const now = new Date();
    const startedAt = new Date(existing.startedAt);
    const deadline = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);

    // If the existing session has NOT expired, reuse it
    if (now <= deadline) {
      return { success: true, startedAt: existing.startedAt };
    }

    // If expired, mark it as completed (timed out) and create a new session
    await (supabase as any)
      .from('Submission')
      .update({
        status: 'COMPLETED',
        score: 0,
        passed: false,
      })
      .eq('id', existing.id);
  }

  // Create a new session for a fresh attempt
  const { data: created, error } = await (supabase as any)
    .from('Submission')
    .insert({
      id: crypto.randomUUID(),
      userId: user.id,
      examId: exam.id,
      passed: false,
      status: 'ONGOING',
      answers: {},
    })
    .select()
    .single();

  if (error || !created) {
    return { success: false, error: 'Failed to create session' };
  }

  return { success: true, startedAt: (created as any).startedAt };
}
