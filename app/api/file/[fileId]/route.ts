import { auth } from '@clerk/nextjs/server';
import { getFileStream, getFileMetadata } from '@/lib/drive';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { fileId } = await params;

  if (!fileId) {
    return new NextResponse('Missing file ID', { status: 400 });
  }

  try {
    // 1. Get metadata
    const metadata = await getFileMetadata(fileId);
    
    // 2. Get the stream (Node.js Readable)
    const nodeStream = await getFileStream(fileId);

    // 3. Convert Node Readable to Web ReadableStream
    // This is required because App Router uses Web Standards
    const webStream = new ReadableStream({
      async start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
    });

    // 4. Return the stream
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${metadata.name}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('File serve error:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}
