import { auth, currentUser } from '@clerk/nextjs/server';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { prisma } from '@/lib/prisma';

export default async function ResourcesPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  let userRole: 'ADMIN' | 'STUDENT' = 'STUDENT';
  if (userId) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { role: true },
      });
      if (dbUser) {
        userRole = dbUser.role;
      }
    }
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      color: true,
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar subjects={subjects} userRole={userRole} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav userRole={userRole} />
    </div>
  );
}
