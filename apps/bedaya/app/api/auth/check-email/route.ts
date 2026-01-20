import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@rawa7el/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Check in User table
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .limit(1)
      .single()

    if (existingUser) {
      return NextResponse.json({ exists: true })
    }

    // Also check auth.users via admin query (if User table doesn't have all users)
    const { data: authUser } = await supabase.auth.admin.listUsers()
    const emailExists = authUser?.users?.some(
      (user) => user.email?.toLowerCase() === email.trim().toLowerCase()
    )

    return NextResponse.json({ exists: emailExists || false })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ exists: false })
  }
}
