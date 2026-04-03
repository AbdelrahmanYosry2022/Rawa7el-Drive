import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient as createServerClient } from '@rawa7el/supabase/server';
import type { Database } from '@rawa7el/supabase';
import QRCode from 'qrcode';

type AttendanceSessionRow = Database['public']['Tables']['AttendanceSession']['Row'];

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // End any previously active sessions
    await (supabase as any)
      .from('AttendanceSession')
      .update({ isActive: false, endedAt: new Date().toISOString() })
      .eq('isActive', true);

    // Create a new attendance session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

    const { data: session, error } = await (supabase as any)
      .from('AttendanceSession')
      .insert({
        id: sessionId,
        title: `جلسة حضور ${now.toLocaleDateString('ar-SA')}`,
        date: now.toISOString(),
        startTime: now.toISOString(),
        isActive: true,
        pinCode,
        lateThresholdMinutes: 15,
        maxDurationMinutes: 120,
        platform: 'BEDAYA',
        createdAt: now.toISOString(),
      })
      .select()
      .single() as { data: AttendanceSessionRow | null; error: any };

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Generate QR code URL - get the actual host from request headers
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3003';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    const checkInUrl = `${baseUrl}/attendance/checkin/${sessionId}`;
    const qrCodeUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      session: {
        id: session!.id,
        createdAt: session!.createdAt,
        pinCode: session!.pinCode,
        isActive: session!.isActive,
        attendees: [],
      },
      qrCodeUrl,
      checkInUrl,
    });
  } catch (error) {
    console.error('Error in POST /api/attendance/session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
