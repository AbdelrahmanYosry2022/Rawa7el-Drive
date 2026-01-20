import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@rawa7el/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Use the database function to check if email exists in auth.users
    const { data, error } = await (supabase.rpc as any)('check_email_exists', {
      email_to_check: email.trim().toLowerCase()
    })

    if (error) {
      console.error('Error checking email:', error)
      // Fallback: check User table
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .limit(1)
        .single()
      
      return NextResponse.json({ exists: !!existingUser })
    }

    return NextResponse.json({ exists: data === true })
  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json({ exists: false })
  }
}
