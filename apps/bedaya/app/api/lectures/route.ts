// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// GET - Fetch all lectures with materials and schedules count
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'BEDAYA';

    const { data: lectures, error } = await (supabase as any)
      .from('Lecture')
      .select(`
        *,
        instructor:instructorId(id, name, email),
        LectureMaterial(id),
        LectureSchedule(id)
      `)
      .eq('platform', platform)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching lectures:', error);
      return NextResponse.json({ error: 'فشل في جلب المحاضرات' }, { status: 500 });
    }

    // Transform to include counts
    const lecturesWithCounts = lectures.map((lecture: any) => ({
      ...lecture,
      materialsCount: lecture.LectureMaterial?.length || 0,
      schedulesCount: lecture.LectureSchedule?.length || 0,
      LectureMaterial: undefined,
      LectureSchedule: undefined,
    }));

    return NextResponse.json({ lectures: lecturesWithCounts });
  } catch (error) {
    console.error('Error in GET /api/lectures:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// POST - Create a new lecture
export async function POST(request: Request) {
  try {
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
      order,
      platform = 'BEDAYA'
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'عنوان المحاضرة مطلوب' }, { status: 400 });
    }

    const { data: lecture, error } = await (supabase as any)
      .from('Lecture')
      .insert({
        id: crypto.randomUUID(),
        title,
        description,
        instructorId,
        instructorName,
        instructorBio,
        thumbnailUrl,
        duration,
        isPublished: isPublished || false,
        order: order || 0,
        platform,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lecture:', error);
      return NextResponse.json({ error: 'فشل في إنشاء المحاضرة', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ lecture, message: 'تم إنشاء المحاضرة بنجاح' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/lectures:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
