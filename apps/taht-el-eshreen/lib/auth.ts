import { createServerClient } from '@rawa7el/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function getUser() {
  // Bypass for dummy mode
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    const cookieStore = await cookies()
    if (cookieStore.get('dummy-auth')?.value === 'true') {
      return {
        id: 'dummy-user-id',
        email: 'dummy@example.com',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        role: 'authenticated'
      } as any
    }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserWithProfile() {
  // Bypass for dummy mode
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    const user = await getUser()
    if (user) {
      return {
        user,
        profile: {
          id: user.id,
          email: user.email,
          name: 'مستخدم تجريبي',
          role: 'ADMIN',
          platform: 'TAHT_EL_ESHREEN',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          phone: null,
          avatar: null
        } as any
      }
    }
    return null
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return { user, profile }
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const data = await getUserWithProfile()
  if (!data) {
    redirect('/login')
  }
  if (data.profile?.role !== 'ADMIN' && data.profile?.role !== 'SUPER_ADMIN') {
    redirect('/')
  }
  return data
}

export async function getSession() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
