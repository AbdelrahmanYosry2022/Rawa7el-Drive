// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// GET - Fetch a single material
export async function GET(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params;
    const supabase = await createServerClient();

    const { data: material, error } = await (supabase as any)
      .from('Material')
      .select('*, uploader:uploadedBy(id, name)')
      .eq('id', materialId)
      .single();

    if (error || !material) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ material });
  } catch (error) {
    console.error('Error in GET /api/materials/[materialId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// PUT - Update material metadata
export async function PUT(
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
    const { title, description } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const { data: material, error } = await (supabase as any)
      .from('Material')
      .update(updateData)
      .eq('id', materialId)
      .select()
      .single();

    if (error) {
      console.error('Error updating material:', error);
      return NextResponse.json({ error: 'فشل في تحديث الملف' }, { status: 500 });
    }

    return NextResponse.json({ material, message: 'تم تحديث الملف بنجاح' });
  } catch (error) {
    console.error('Error in PUT /api/materials/[materialId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// DELETE - Delete a material
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

    // Get material to find storage path
    const { data: material } = await (supabase as any)
      .from('Material')
      .select('storagePath')
      .eq('id', materialId)
      .single();

    if (material?.storagePath) {
      // Delete from storage
      await supabase.storage
        .from('bedaya-materials')
        .remove([material.storagePath]);
    }

    // Delete from database (cascade will remove CalendarEventMaterial links)
    const { error } = await (supabase as any)
      .from('Material')
      .delete()
      .eq('id', materialId);

    if (error) {
      console.error('Error deleting material:', error);
      return NextResponse.json({ error: 'فشل في حذف الملف' }, { status: 500 });
    }

    return NextResponse.json({ message: 'تم حذف الملف بنجاح' });
  } catch (error) {
    console.error('Error in DELETE /api/materials/[materialId]:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
