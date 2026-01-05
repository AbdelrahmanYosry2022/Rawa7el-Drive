// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// POST - Link material to an event
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'معرف المحاضرة مطلوب' }, { status: 400 });
    }

    // Check if link already exists
    const { data: existing } = await (supabase as any)
      .from('CalendarEventMaterial')
      .select('id')
      .eq('eventId', eventId)
      .eq('materialId', materialId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'الملف مرتبط بالفعل بهذه المحاضرة' }, { status: 400 });
    }

    // Get max order for this event
    const { data: maxOrderData } = await (supabase as any)
      .from('CalendarEventMaterial')
      .select('order')
      .eq('eventId', eventId)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxOrderData?.order || 0) + 1;

    const { data: link, error } = await (supabase as any)
      .from('CalendarEventMaterial')
      .insert({
        id: crypto.randomUUID(),
        eventId,
        materialId,
        order: newOrder,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error linking material:', error);
      return NextResponse.json({ error: 'فشل في ربط الملف بالمحاضرة' }, { status: 500 });
    }

    return NextResponse.json({ link, message: 'تم ربط الملف بالمحاضرة بنجاح' });
  } catch (error) {
    console.error('Error in POST /api/materials/[materialId]/link:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
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
