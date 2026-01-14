import { createClient } from '@rawa7el/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const isDummyMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder');
    const hasDummyAuth = cookieStore.get('dummy-auth')?.value === 'true';

    if (!isDummyMode || !hasDummyAuth) {
      redirect('/login');
    }
  }

  // Redirect authenticated users to dashboard
  redirect('/dashboard');
}
