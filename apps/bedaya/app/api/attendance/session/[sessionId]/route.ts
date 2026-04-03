import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';
import type { Database } from '@rawa7el/supabase';

type AttendanceSessionRow = Database['public']['Tables']['AttendanceSession']['Row'];
type AttendanceRow = Database['public']['Tables']['Attendance']['Row'];
type UserRow = Database['public']['Tables']['User']['Row'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const supabase = await createServerClient();

    // Get session with attendees
    const { data: session, error: sessionError } = await (supabase as any)
      .from('AttendanceSession')
      .select('*')
      .eq('id', sessionId)
      .single() as { data: AttendanceSessionRow | null; error: any };

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get attendees for this session
    const { data: attendances, error: attendanceError } = await (supabase as any)
      .from('Attendance')
      .select('userId, status, checkInTime, createdAt')
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true }) as { data: Pick<AttendanceRow, 'userId' | 'status' | 'checkInTime' | 'createdAt'>[] | null; error: any };

    if (attendanceError) {
      console.error('Error fetching attendances:', attendanceError);
    }

    // Fetch user details for all attendees
    const userIds = (attendances || []).map((a) => a.userId);
    let userMap: Record<string, { name: string | null; email: string }> = {};

    if (userIds.length > 0) {
      const { data: users } = await (supabase as any)
        .from('User')
        .select('id, name, email')
        .in('id', userIds) as { data: Pick<UserRow, 'id' | 'name' | 'email'>[] | null; error: any };

      (users || []).forEach((u) => {
        userMap[u.id] = { name: u.name, email: u.email };
      });
    }

    const attendees = (attendances || []).map((a) => ({
      id: a.userId,
      name: userMap[a.userId]?.name || 'طالب',
      email: userMap[a.userId]?.email || '',
      status: a.status,
      checkedInAt: a.checkInTime || a.createdAt,
    }));

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        isActive: session.isActive,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        attendees,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/attendance/session/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
