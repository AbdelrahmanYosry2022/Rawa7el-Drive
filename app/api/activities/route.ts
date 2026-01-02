import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: user.id },
      select: { role: true },
    });

    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, content, subjectId, dueDate } = body;

    if (!title || !type || !subjectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description: description || null,
        type,
        content: content || null,
        subjectId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
