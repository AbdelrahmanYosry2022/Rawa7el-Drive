// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// GET - Fetch a single lecture with all details
export async function GET(
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

    // Get lecture with instructor
    const { data: lecture, error } = await (supabase as any)
      .from('Lecture')
      .select(`
        *,
        instructor:instructorId(id, name, email)
      `)
      .eq('id', lectureId)
      .single();

    if (error || !lecture) {
      return NextResponse.json({ error: 'المحاضرة غير موجودة' }, { status: 404 });
    }

    // Get linked materials
    const { data: lectureMaterials } = await (supabase as any)
      .from('LectureMaterial')
      .select(`
        id,
        order,
        material:materialId(*)
      `)
      .eq('lectureId', lectureId)
      .order('order', { ascending: true });

    // Get linked schedules (calendar events)
    const { data: lectureSchedules } = await (supabase as any)
      .from('LectureSchedule')
      .select(`
        id,
        event:eventId(*)
      `)
      .eq('lectureId', lectureId);

    return NextResponse.json({
      lecture: {
        ...lecture,
        materials: lectureMaterials?.map((lm: any) => lm.material) || [],
        schedules: lectureSchedules?.map((ls: any) => ls.event) || [],
      }
    });
  } catch (error) {
    console.error('Error in GET /api/lectures/[lectureId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Update a lecture
export async function PUT(
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
    const { 
      title, 
      description, 
      instructorId, 
      instructorName, 
      instructorBio,
      thumbnailUrl,
      duration,
      isPublished,
      order
    } = body;

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (instructorName !== undefined) updateData.instructorName = instructorName;
    if (instructorBio !== undefined) updateData.instructorBio = instructorBio;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (duration !== undefined) updateData.duration = duration;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (order !== undefined) updateData.order = order;

    const { data: lecture, error } = await (supabase as any)
      .from('Lecture')
      .update(updateData)
      .eq('id', lectureId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lecture:', error);
      return NextResponse.json({ error: 'فشل في تحديث المحاضرة' }, { status: 500 });
    }

    return NextResponse.json({ lecture, message: 'تم تحديث المحاضرة بنجاح' });
  } catch (error) {
    console.error('Error in PUT /api/lectures/[lectureId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Delete a lecture
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

    const { error } = await (supabase as any)
      .from('Lecture')
      .delete()
      .eq('id', lectureId);

    if (error) {
      console.error('Error deleting lecture:', error);
      return NextResponse.json({ error: 'فشل في حذف المحاضرة' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف المحاضرة بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[lectureId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
