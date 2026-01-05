// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// POST - Link materials to a lecture
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
    const { materialId, materialIds } = body;

    const idsToLink = materialIds || (materialId ? [materialId] : []);

    if (idsToLink.length === 0) {
      return NextResponse.json({ error: 'معرف المادة مطلوب' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const matId of idsToLink) {
      // Check if already linked
      const { data: existing } = await (supabase as any)
        .from('LectureMaterial')
        .select('id')
        .eq('lectureId', lectureId)
        .eq('materialId', matId)
        .maybeSingle();

      if (existing) continue;

      // Get max order
      const { data: maxOrderData } = await (supabase as any)
        .from('LectureMaterial')
        .select('order')
        .eq('lectureId', lectureId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newOrder = (maxOrderData?.order || 0) + 1;

      const { data: link, error } = await (supabase as any)
        .from('LectureMaterial')
        .insert({
          id: crypto.randomUUID(),
          lectureId,
          materialId: matId,
          order: newOrder,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        errors.push({ materialId: matId, error: error.message });
      } else {
        results.push(link);
      }
    }

    return NextResponse.json({ 
      links: results, 
      message: `تم ربط ${results.length} مادة بالمحاضرة` 
    });
  } catch (error) {
    console.error('Error in POST /api/lectures/[lectureId]/materials:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Unlink a material from a lecture
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
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json({ error: 'معرف المادة مطلوب' }, { status: 400 });
    }

    const { error } = await (supabase as any)
      .from('LectureMaterial')
      .delete()
      .eq('lectureId', lectureId)
      .eq('materialId', materialId);

    if (error) {
      console.error('Error unlinking material:', error);
      return NextResponse.json({ error: 'فشل في إلغاء ربط المادة' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم إلغاء ربط المادة بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/lectures/[lectureId]/materials:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
