'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return dbUser;
}

export async function getUsers() {
  const currentUser = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return {
    currentUserId: currentUser.id,
    users,
  };
}

export type UserRole = 'ADMIN' | 'STUDENT';

export async function updateUserRole(userId: string, newRole: UserRole) {
  const currentUser = await requireAdmin();

  if (!userId) {
    throw new Error('User id is required');
  }

  if (newRole !== 'ADMIN' && newRole !== 'STUDENT') {
    throw new Error('Invalid role');
  }

  if (currentUser.id === userId) {
    throw new Error('You cannot change your own role');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath('/teacher/users');
}

export async function deleteUser(userId: string) {
  const currentUser = await requireAdmin();

  if (!userId) {
    throw new Error('User id is required');
  }

  if (currentUser.id === userId) {
    throw new Error('You cannot delete your own account');
  }

  // Delete submissions explicitly (also covered by onDelete: Cascade, but kept for clarity)
  await prisma.submission.deleteMany({ where: { userId } });

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath('/teacher/users');
}
