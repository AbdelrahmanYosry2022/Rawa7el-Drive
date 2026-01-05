// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@rawa7el/supabase';

// GET - Fetch all calendar events
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    let query = (supabase as any)
      .from('CalendarEvent')
      .select('*, creator:createdBy(id, name)')
      .eq('platform', 'BEDAYA')
      .order('date', { ascending: true });

    // Filter by month/year if provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query = query
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json({ error: 'فشل في تحميل الأحداث' }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Error in GET /api/calendar:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// POST - Create a new calendar event
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Development mode: skip role check
    // TODO: Re-enable role check in production

    const body = await request.json();
    const { title, description, date, startTime, endTime, location, speakers } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'العنوان والتاريخ مطلوبان' }, { status: 400 });
    }

    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: event, error } = await (supabase as any)
      .from('CalendarEvent')
      .insert({
        id: eventId,
        title,
        description: description || null,
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        speakers: speakers || null,
        status: 'SCHEDULED',
        platform: 'BEDAYA',
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return NextResponse.json({ error: 'فشل في إنشاء الحدث' }, { status: 500 });
    }

    return NextResponse.json({ event, message: 'تم إنشاء الحدث بنجاح' });
  } catch (error) {
    console.error('Error in POST /api/calendar:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
