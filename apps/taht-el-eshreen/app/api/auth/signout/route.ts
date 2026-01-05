import { createServerClient } from '@rawa7el/supabase'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3002'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  
  return NextResponse.redirect(new URL('/login', `${protocol}://${host}`))
}
