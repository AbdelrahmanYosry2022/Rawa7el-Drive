import { createClient } from '@rawa7el/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('User')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (!adminCheck || !['SUPER_ADMIN', 'ADMIN'].includes(adminCheck.role)) {
      return NextResponse.json({ error: 'غير مصرح - يجب أن تكون مديراً' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, phone, role, platform } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 })
    }

    // Create auth user using admin API (requires service role key)
    // For now, we'll use the regular signup but disable email confirmation in Supabase dashboard
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجل بالفعل' }, { status: 400 })
      }
      return NextResponse.json({ error: 'فشل في إنشاء المستخدم' }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'فشل في إنشاء المستخدم' }, { status: 500 })
    }

    // Create user record in our User table
    const { error: dbError } = await supabase
      .from('User')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name: name || null,
        phone: phone || null,
        role: role || 'STUDENT',
        platform: platform || 'BEDAYA',
        isActive: true
      })

    if (dbError) {
      console.error('DB error:', dbError)
      // Try to delete the auth user if db insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'فشل في حفظ بيانات المستخدم' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 })
  }
}
