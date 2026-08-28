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

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ tags });
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

    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');

    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name: cleanName } },
      update: {},
      create: {
        userId,
        name: cleanName,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
