// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@rawa7el/supabase';
import QRCode from 'qrcode';

export async function POST() {
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

    // Generate QR code URL - points to the check-in page
    const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/attendance/checkin/${sessionId}`;
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
