// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

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
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get attendees for this session
    const { data: attendances, error: attendanceError } = await (supabase as any)
      .from('Attendance')
      .select('*, User:userId(id, name, email)')
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true });

    const attendees = (attendances || []).map((a: any) => ({
      id: a.User?.id || a.userId,
      name: a.User?.name || 'طالب',
      email: a.User?.email || '',
      checkedInAt: a.createdAt,
    }));

    return NextResponse.json({
      session: {
        id: session.id,
        createdAt: session.createdAt,
        attendees,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/attendance/session/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
