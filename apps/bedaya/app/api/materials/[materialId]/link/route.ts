// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// POST - Link material to one or more events
export async function POST(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, eventIds } = body;

    // Support single eventId or array of eventIds
    const idsToLink = eventIds || (eventId ? [eventId] : []);

    if (idsToLink.length === 0) {
      return NextResponse.json({ error: 'معرف المحاضرة مطلوب' }, { status: 400 });
    }

    console.log('Linking material:', materialId, 'to events:', idsToLink);

    const results = [];
    const errors = [];

    for (const evId of idsToLink) {
      // Check if link already exists
      const { data: existing } = await (supabase as any)
        .from('CalendarEventMaterial')
        .select('id')
        .eq('eventId', evId)
        .eq('materialId', materialId)
        .maybeSingle();

      if (existing) {
        console.log('Link already exists for event:', evId);
        continue; // Skip if already linked, don't error
      }

      // Get max order for this event
      const { data: maxOrderData } = await (supabase as any)
        .from('CalendarEventMaterial')
        .select('order')
        .eq('eventId', evId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newOrder = (maxOrderData?.order || 0) + 1;

      const { data: link, error } = await (supabase as any)
        .from('CalendarEventMaterial')
        .insert({
          id: crypto.randomUUID(),
          eventId: evId,
          materialId,
          order: newOrder,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error linking material to event:', evId, error);
        errors.push({ eventId: evId, error: error.message });
      } else {
        results.push(link);
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: 'فشل في ربط الملف بالمحاضرات', 
        details: errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      links: results, 
      message: `تم ربط الملف بـ ${results.length} محاضرة بنجاح`,
      skipped: idsToLink.length - results.length - errors.length
    });
  } catch (error) {
    console.error('Error in POST /api/materials/[materialId]/link:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع', details: String(error) }, { status: 500 });
  }
}

// DELETE - Unlink material from an event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'معرف المحاضرة مطلوب' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('CalendarEventMaterial')
      .delete()
      .eq('eventId', eventId)
      .eq('materialId', materialId);

    if (error) {
      console.error('Error unlinking material:', error);
      return NextResponse.json({ error: 'فشل في إلغاء ربط الملف' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم إلغاء ربط الملف بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/materials/[materialId]/link:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
