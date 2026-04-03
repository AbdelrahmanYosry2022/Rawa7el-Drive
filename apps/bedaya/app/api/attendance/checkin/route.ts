import { NextResponse } from 'next/server';
import { createPublicClient } from '@rawa7el/supabase';
import type { Database } from '@rawa7el/supabase';
import {
  determineAttendanceStatus,
  validateSessionForCheckIn,
  getSessionStartTime,
} from '@rawa7el/attendance-logic/utils';

type AttendanceSessionRow = Database['public']['Tables']['AttendanceSession']['Row'];
type AttendanceRow = Database['public']['Tables']['Attendance']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];

// Helper to work around Supabase client type inference issues with custom Database types
function db(supabase: ReturnType<typeof createPublicClient>) {
  return supabase as unknown as {
    from: (table: string) => ReturnType<ReturnType<typeof createPublicClient>['from']>;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, name, email, visitorId } = body;

    if (!sessionId || !visitorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createPublicClient();
    const now = new Date();

    // Check if session exists and fetch all needed fields
    const { data: session, error: sessionError } = await (supabase as any)
      .from('AttendanceSession')
      .select('id, title, date, startTime, endTime, endedAt, isActive, lateThresholdMinutes, maxDurationMinutes, createdAt')
      .eq('id', sessionId)
      .single() as { data: AttendanceSessionRow | null; error: any };

    if (sessionError || !session) {
      return NextResponse.json({ error: 'جلسة الحضور غير موجودة' }, { status: 404 });
    }

    // Validate session is accepting check-ins
    const validation = validateSessionForCheckIn({
      id: session.id,
      isActive: session.isActive,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      endedAt: session.endedAt,
      maxDurationMinutes: session.maxDurationMinutes,
      createdAt: session.createdAt,
    }, now);

    if (!validation.valid) {
      return NextResponse.json({
        error: validation.message || 'جلسة الحضور غير متاحة',
        reason: validation.reason,
      }, { status: 410 }); // 410 Gone
    }

    // Determine attendance status (PRESENT vs LATE)
    const sessionStartTime = getSessionStartTime(session);
    const attendanceStatus = determineAttendanceStatus({
      sessionStartTime,
      checkInTime: now,
      lateThresholdMinutes: session.lateThresholdMinutes ?? 15,
    });

    // Check if this visitor already checked in (by visitorId)
    const { data: existingAttendance } = await (supabase as any)
      .from('Attendance')
      .select('*')
      .eq('sessionId', sessionId)
      .eq('notes', `visitor:${visitorId}`)
      .single() as { data: AttendanceRow | null; error: any };

    if (existingAttendance) {
      return NextResponse.json({
        success: true,
        message: 'تم تسجيل حضورك مسبقاً',
        alreadyCheckedIn: true,
      });
    }

    // Find or create user - check multiple ways
    let userId: string;

    // 1. First check if we have a user with this visitorId stored in phone field
    const { data: userByVisitor } = await (supabase as any)
      .from('User')
      .select('*')
      .eq('phone', `visitor:${visitorId}`)
      .single() as { data: UserRow | null; error: any };

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
          .single() as { data: UserRow | null; error: any };

        if (userByEmail) {
          // Found registered user by email - use their userId
          userId = userByEmail.id;

          // Check if this user already checked in for this session
          const { data: userAttendance } = await (supabase as any)
            .from('Attendance')
            .select('*')
            .eq('sessionId', sessionId)
            .eq('userId', userId)
            .single() as { data: AttendanceRow | null; error: any };

          if (userAttendance) {
            return NextResponse.json({
              success: true,
              message: `مرحباً ${userByEmail.name}! تم تسجيل حضورك مسبقاً`,
              alreadyCheckedIn: true,
              isRegisteredUser: true,
            });
          }

          // Create attendance record for registered user
          const { error: attendanceError } = await (supabase as any)
            .from('Attendance')
            .insert({
              id: crypto.randomUUID(),
              sessionId,
              userId,
              status: attendanceStatus,
              checkInTime: now.toISOString(),
              notes: `visitor:${visitorId}`,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });

          if (attendanceError) {
            console.error('Error creating attendance:', attendanceError);
            return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
          }

          const statusMessage = attendanceStatus === 'LATE' ? ' (متأخر)' : '';
          return NextResponse.json({
            success: true,
            message: `مرحباً ${userByEmail.name}! تم تسجيل حضورك بنجاح${statusMessage}`,
            alreadyCheckedIn: false,
            isRegisteredUser: true,
            userName: userByEmail.name,
            status: attendanceStatus,
          });
        }
      }

      // 3. First time visitor - require name and email
      if (!name || !email) {
        return NextResponse.json({
          error: 'First time check-in requires name and email',
          requiresRegistration: true,
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
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
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
        status: attendanceStatus,
        checkInTime: now.toISOString(),
        notes: `visitor:${visitorId}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

    if (attendanceError) {
      console.error('Error creating attendance:', attendanceError);
      return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
    }

    const statusMessage = attendanceStatus === 'LATE' ? ' (تم تسجيلك متأخراً)' : '';
    return NextResponse.json({
      success: true,
      message: `تم تسجيل حضورك بنجاح!${statusMessage}`,
      alreadyCheckedIn: false,
      status: attendanceStatus,
    });
  } catch (error) {
    console.error('Error in POST /api/attendance/checkin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
