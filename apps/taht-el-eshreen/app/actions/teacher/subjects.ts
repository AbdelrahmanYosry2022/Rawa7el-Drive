'use server';

import { createClient as createServerClient } from '@rawa7el/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return dbUser;
}

export type SubjectInput = {
  title: string;
  description?: string | null;
};

export async function createSubject(data: SubjectInput) {
  await requireAdmin();

  if (!data.title.trim()) {
    throw new Error('Title is required');
  }

  await prisma.subject.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim() || null,
    },
  });

  revalidatePath('/teacher/subjects');
}

export async function deleteSubject(id: string) {
  await requireAdmin();

  if (!id) {
    throw new Error('Subject id is required');
  }

  await prisma.subject.delete({ where: { id } });

  revalidatePath('/teacher/subjects');
}

export type UpdateSubjectInput = {
  title?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
};

export async function updateSubject(id: string, data: UpdateSubjectInput) {
  await requireAdmin();

  if (!id) {
    throw new Error('Subject id is required');
  }

  const updateData: any = {};

  if (data.title !== undefined) {
    updateData.title = data.title.trim();
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }
  if (data.icon !== undefined) {
    updateData.icon = data.icon || null;
  }
  if (data.color !== undefined) {
    updateData.color = data.color || null;
  }

  await prisma.subject.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/teacher/subjects');
  revalidatePath(`/teacher/subjects/${id}`);
}
