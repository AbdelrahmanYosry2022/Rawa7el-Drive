// @ts-nocheck
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient as createServerClient } from '@rawa7el/supabase/server';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new attendance session
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: session, error } = await (supabase as any)
      .from('AttendanceSession')
      .insert({
        id: sessionId,
        title: `جلسة حضور ${new Date().toLocaleDateString('ar-SA')}`,
        date: now,
        platform: 'BEDAYA',
        createdAt: now,
      })
      .select()
      .single();

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
        id: session.id,
        createdAt: session.createdAt,
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
