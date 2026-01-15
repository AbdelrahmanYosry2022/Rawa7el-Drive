import { createClient } from '@rawa7el/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate random token
function generateToken(length: number = 12): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

// GET - List all invitation links
export async function GET() {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as any)?.role
  if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await (supabase as any)
    .from('invitation_links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Create new invitation link
export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as any)?.role
  if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { label, max_uses, expires_at } = body

  // Generate unique token
  const token = generateToken(12)

  const { data, error } = await (supabase as any)
    .from('invitation_links')
    .insert({
      token,
      label: label || null,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      created_by: user.id,
      uses_count: 0,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE - Deactivate invitation link
export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('User')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as any)?.role
  if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from('invitation_links')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
