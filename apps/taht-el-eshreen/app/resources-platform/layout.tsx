import { createServerClient } from '@rawa7el/supabase';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/mobile-nav';

export default async function ResourcesPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userRole: 'ADMIN' | 'STUDENT' = 'STUDENT';
  if (user) {
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();
    if (dbUser) {
      userRole = (dbUser as any).role as 'ADMIN' | 'STUDENT';
    }
  }

  const { data: subjects } = await supabase
    .from('Subject')
    .select('id, title, color')
    .order('createdAt', { ascending: false });

  const mappedSubjects = (subjects || []).map((s: any) => ({ id: s.id, title: s.title, color: s.color }));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar subjects={mappedSubjects} userRole={userRole} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav userRole={userRole} />
    </div>
  );
}
