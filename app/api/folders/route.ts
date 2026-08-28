import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUser(
      userId,
      req.headers.get('x-user-email') || undefined,
      req.headers.get('x-user-name') || undefined
    );

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ folders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUser(
      userId,
      req.headers.get('x-user-email') || undefined,
      req.headers.get('x-user-name') || undefined
    );

    const { name, parentId = null } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        userId,
        parentId,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
