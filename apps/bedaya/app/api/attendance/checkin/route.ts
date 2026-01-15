// @ts-nocheck
import { NextResponse } from 'next/server';
import { createPublicClient } from '@rawa7el/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, name, email, visitorId } = body;

    if (!sessionId || !visitorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createPublicClient();

    // Check if session exists
    const { data: session, error: sessionError } = await (supabase as any)
      .from('AttendanceSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if this visitor already checked in (by visitorId)
    const { data: existingAttendance } = await (supabase as any)
      .from('Attendance')
      .select('*')
      .eq('sessionId', sessionId)
      .eq('notes', `visitor:${visitorId}`)
      .single();

    if (existingAttendance) {
      return NextResponse.json({ 
        success: true, 
        message: 'تم تسجيل حضورك مسبقاً',
        alreadyCheckedIn: true 
      });
    }

    // Find or create user - check multiple ways
    let userId: string;

    // 1. First check if we have a user with this visitorId stored in phone field
    const { data: userByVisitor } = await (supabase as any)
      .from('User')
      .select('*')
      .eq('phone', `visitor:${visitorId}`)
      .single();

    if (userByVisitor) {
      // Found by visitorId - returning visitor
      userId = userByVisitor.id;
      
      // Update name/email if provided and different
      if (name && name !== userByVisitor.name) {
        await (supabase as any)
          .from('User')
          .update({ name, email: email || userByVisitor.email })
          .eq('id', userId);
      }
    } else {
      // 2. Check if user exists by email (registered via invitation)
      if (email) {
        const { data: userByEmail } = await (supabase as any)
          .from('User')
          .select('*')
          .eq('email', email)
          .single();

        if (userByEmail) {
          // Found registered user by email - use their userId
          userId = userByEmail.id;
          
          // Check if this user already checked in for this session
          const { data: userAttendance } = await (supabase as any)
            .from('Attendance')
            .select('*')
            .eq('sessionId', sessionId)
            .eq('userId', userId)
            .single();

          if (userAttendance) {
            return NextResponse.json({ 
              success: true, 
              message: `مرحباً ${userByEmail.name}! تم تسجيل حضورك مسبقاً`,
              alreadyCheckedIn: true,
              isRegisteredUser: true
            });
          }

          // Create attendance record for registered user
          const { error: attendanceError } = await (supabase as any)
            .from('Attendance')
            .insert({
              id: crypto.randomUUID(),
              sessionId,
              userId,
              status: 'PRESENT',
              notes: `visitor:${visitorId}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

          if (attendanceError) {
            console.error('Error creating attendance:', attendanceError);
            return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
          }

          return NextResponse.json({ 
            success: true, 
            message: `مرحباً ${userByEmail.name}! تم تسجيل حضورك بنجاح`,
            alreadyCheckedIn: false,
            isRegisteredUser: true,
            userName: userByEmail.name
          });
        }
      }

      // 3. First time visitor - require name and email
      if (!name || !email) {
        return NextResponse.json({ 
          error: 'First time check-in requires name and email',
          requiresRegistration: true 
        }, { status: 400 });
      }

      // Create new user
      const newUserId = crypto.randomUUID();
      const { error: createError } = await (supabase as any)
        .from('User')
        .insert({
          id: newUserId,
          name,
          email,
          phone: `visitor:${visitorId}`, // Store visitorId in phone field for lookup
          role: 'STUDENT',
          platform: 'BEDAYA',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      userId = newUserId;
    }

    // Create attendance record
    const { error: attendanceError } = await (supabase as any)
      .from('Attendance')
      .insert({
        id: crypto.randomUUID(),
        sessionId,
        userId,
        status: 'PRESENT',
        notes: `visitor:${visitorId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    if (attendanceError) {
      console.error('Error creating attendance:', attendanceError);
      return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم تسجيل حضورك بنجاح!',
      alreadyCheckedIn: false 
    });
  } catch (error) {
    console.error('Error in POST /api/attendance/checkin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
