import { createServerClient } from '@rawa7el/supabase';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect authenticated users to dashboard
  redirect('/dashboard');
}
