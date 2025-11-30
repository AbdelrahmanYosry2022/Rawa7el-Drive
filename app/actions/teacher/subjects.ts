'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return user;
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
