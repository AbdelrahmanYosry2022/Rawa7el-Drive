import { ReactNode } from 'react';
import { createServerClient } from '@rawa7el/supabase';
import { redirect } from 'next/navigation';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: dbUser } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!dbUser || (dbUser as any).role !== 'ADMIN') {
    redirect('/');
  }

  // Reuse the global app layout (sidebar + header). Only enforce access here.
  return <>{children}</>;
}
