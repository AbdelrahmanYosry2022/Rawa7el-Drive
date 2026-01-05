// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@rawa7el/supabase';

// GET - Fetch a single calendar event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createServerClient();

    const { data: event, error } = await (supabase as any)
      .from('CalendarEvent')
      .select('*, creator:createdBy(id, name)')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'الحدث غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error in GET /api/calendar/[eventId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Update a calendar event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check if user is admin/teacher
    const { data: userData } = await (supabase as any)
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userData.role)) {
      return NextResponse.json({ error: 'غير مصرح - يجب أن تكون مشرفاً' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, date, startTime, endTime, location, speakers, status } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
    if (speakers !== undefined) updateData.speakers = speakers;
    if (status !== undefined) updateData.status = status;

    const { data: event, error } = await (supabase as any)
      .from('CalendarEvent')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return NextResponse.json({ error: 'فشل في تحديث الحدث' }, { status: 500 });
    }

    return NextResponse.json({ event, message: 'تم تحديث الحدث بنجاح' });
  } catch (error) {
    console.error('Error in PUT /api/calendar/[eventId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Delete a calendar event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check if user is admin/teacher
    const { data: userData } = await (supabase as any)
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(userData.role)) {
      return NextResponse.json({ error: 'غير مصرح - يجب أن تكون مشرفاً' }, { status: 403 });
    }

    const { error } = await (supabase as any)
      .from('CalendarEvent')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return NextResponse.json({ error: 'فشل في حذف الحدث' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الحدث بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/calendar/[eventId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
