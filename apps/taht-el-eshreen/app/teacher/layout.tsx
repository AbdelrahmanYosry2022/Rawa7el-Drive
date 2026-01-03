import { ReactNode } from 'react';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  let dbUser = await prisma.user.findUnique({ where: { clerkId: user.id } });

  if (!dbUser) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email,
          role: 'STUDENT',
        },
      });
    }
  }

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/');
  }

  // Reuse the global app layout (sidebar + header). Only enforce access here.
  return <>{children}</>;
}
