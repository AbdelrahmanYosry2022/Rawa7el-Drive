// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// POST - Link calendar events (schedules) to a lecture
export async function POST(
  request: Request,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  try {
    const { lectureId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, eventIds } = body;

    const idsToLink = eventIds || (eventId ? [eventId] : []);

    if (idsToLink.length === 0) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const evId of idsToLink) {
      // Check if already linked
      const { data: existing } = await (supabase as any)
        .from('LectureSchedule')
        .select('id')
        .eq('lectureId', lectureId)
        .eq('eventId', evId)
        .maybeSingle();

      if (existing) continue;

      const { data: link, error } = await (supabase as any)
        .from('LectureSchedule')
        .insert({
          id: crypto.randomUUID(),
          lectureId,
          eventId: evId,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        errors.push({ eventId: evId, error: error.message });
      } else {
        results.push(link);
      }
    }

    return NextResponse.json({ 
      links: results, 
      message: `تم ربط ${results.length} موعد بالمحاضرة` 
    });
  } catch (error) {
    console.error('Error in POST /api/lectures/[lectureId]/schedules:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Unlink a schedule from a lecture
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  try {
    const { lectureId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'معرف الموعد مطلوب' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('LectureSchedule')
      .delete()
      .eq('lectureId', lectureId)
      .eq('eventId', eventId);

    if (error) {
      console.error('Error unlinking schedule:', error);
      return NextResponse.json({ error: 'فشل في إلغاء ربط الموعد' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم إلغاء ربط الموعد بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[lectureId]/schedules:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
