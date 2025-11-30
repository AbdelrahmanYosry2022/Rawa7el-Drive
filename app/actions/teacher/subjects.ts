'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type SubjectFormData = {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
};

export async function createSubject(data: SubjectFormData) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Not authorized' };
  }

  try {
    const subject = await prisma.subject.create({
      data: {
        title: data.title,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
      },
    });

    revalidatePath('/teacher/subjects');
    return { success: true, subject };
  } catch (error) {
    console.error('Failed to create subject:', error);
    return { success: false, error: 'Failed to create subject' };
  }
}

export async function deleteSubject(subjectId: string) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Not authorized' };
  }

  try {
    await prisma.subject.delete({
      where: { id: subjectId },
    });

    revalidatePath('/teacher/subjects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete subject:', error);
    return { success: false, error: 'Failed to delete subject' };
  }
}

export async function updateSubject(subjectId: string, data: SubjectFormData) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { success: false, error: 'Not authorized' };
  }

  try {
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        title: data.title,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
      },
    });

    revalidatePath('/teacher/subjects');
    return { success: true, subject };
  } catch (error) {
    console.error('Failed to update subject:', error);
    return { success: false, error: 'Failed to update subject' };
  }
}
