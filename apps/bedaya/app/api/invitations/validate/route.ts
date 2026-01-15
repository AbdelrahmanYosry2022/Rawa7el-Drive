import { createClient } from '@rawa7el/supabase/server'
import { NextResponse } from 'next/server'

// GET - Validate invitation token
export async function GET(request: Request) {
  const supabase = await createClient()
  
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token is required' }, { status: 400 })
  }

  const { data: invitation, error } = await (supabase as any)
    .from('invitation_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invitation) {
    return NextResponse.json({ valid: false, error: 'رابط الدعوة غير صالح' }, { status: 404 })
  }

  // Check if active
  if (!invitation.is_active) {
    return NextResponse.json({ valid: false, error: 'رابط الدعوة غير مفعل' }, { status: 400 })
  }

  // Check expiry
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'رابط الدعوة منتهي الصلاحية' }, { status: 400 })
  }

  // Check max uses
  if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
    return NextResponse.json({ valid: false, error: 'تم استخدام رابط الدعوة الحد الأقصى من المرات' }, { status: 400 })
  }

  return NextResponse.json({ 
    valid: true, 
    invitation: {
      id: invitation.id,
      label: invitation.label
    }
  })
}

// POST - Increment usage count after successful registration
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  // Increment uses_count using RPC or fallback
  try {
    await (supabase as any).rpc('increment_invitation_uses', { invitation_token: token })
  } catch {
    // Fallback: manual increment
    const { data: invitation } = await (supabase as any)
      .from('invitation_links')
      .select('uses_count')
      .eq('token', token)
      .single()

    if (invitation) {
      await (supabase as any)
        .from('invitation_links')
        .update({ uses_count: (invitation.uses_count || 0) + 1 })
        .eq('token', token)
    }
  }

  return NextResponse.json({ success: true })
}
