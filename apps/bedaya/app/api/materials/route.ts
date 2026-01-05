// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@rawa7el/supabase/server';

// Helper function to determine material type from mime type
function getMaterialType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'POWERPOINT';
  if (mimeType.includes('word') || mimeType.includes('document') || mimeType === 'application/msword') return 'DOCUMENT';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  return 'OTHER';
}

// GET - Fetch all materials
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type');
    const eventId = searchParams.get('eventId');

    let query = (supabase as any)
      .from('Material')
      .select('*, uploader:uploadedBy(id, name)')
      .eq('platform', 'BEDAYA')
      .order('createdAt', { ascending: false });

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error('Error fetching materials:', error);
      return NextResponse.json({ error: 'فشل في تحميل المواد' }, { status: 500 });
    }

    // If eventId is provided, filter materials linked to that event
    if (eventId) {
      const { data: eventMaterials, error: linkError } = await (supabase as any)
        .from('CalendarEventMaterial')
        .select('materialId')
        .eq('eventId', eventId);

      if (!linkError && eventMaterials) {
        const linkedIds = eventMaterials.map((em: any) => em.materialId);
        const filteredMaterials = materials?.filter((m: any) => linkedIds.includes(m.id)) || [];
        return NextResponse.json({ materials: filteredMaterials });
      }
    }

    return NextResponse.json({ materials: materials || [] });
  } catch (error) {
    console.error('Error in GET /api/materials:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

// POST - Upload a new material
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const eventId = formData.get('eventId') as string; // Optional: link to event

    if (!file) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `materials/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bedaya-materials')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'فشل في رفع الملف', details: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bedaya-materials')
      .getPublicUrl(storagePath);

    const materialId = crypto.randomUUID();
    const now = new Date().toISOString();
    const materialType = getMaterialType(file.type);

    // Create material record
    const { data: material, error: dbError } = await (supabase as any)
      .from('Material')
      .insert({
        id: materialId,
        title,
        description: description || null,
        type: materialType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        publicUrl: urlData?.publicUrl || null,
        platform: 'BEDAYA',
        uploadedBy: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating material record:', dbError);
      // Try to delete uploaded file if DB insert fails
      await supabase.storage.from('bedaya-materials').remove([storagePath]);
      return NextResponse.json({ error: 'فشل في حفظ بيانات الملف', details: dbError.message }, { status: 500 });
    }

    // If eventId is provided, link material to event
    if (eventId) {
      const { error: linkError } = await (supabase as any)
        .from('CalendarEventMaterial')
        .insert({
          id: crypto.randomUUID(),
          eventId,
          materialId,
          order: 0,
          createdAt: now,
        });

      if (linkError) {
        console.error('Error linking material to event:', linkError);
        // Don't fail the whole operation, just log the error
      }
    }

    return NextResponse.json({ material, message: 'تم رفع الملف بنجاح' });
  } catch (error) {
    console.error('Error in POST /api/materials:', error);
    return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
