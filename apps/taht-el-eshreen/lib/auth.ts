import { createServerClient } from '@rawa7el/supabase'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserWithProfile() {
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
