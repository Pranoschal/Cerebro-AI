import { NextRequest, NextResponse } from 'next/server';
import { prisma, DEFAULT_USER_ID, ensureDemoUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await ensureDemoUser();
    const userId = req.headers.get('x-user-id') || DEFAULT_USER_ID;
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
    await ensureDemoUser();
    const userId = req.headers.get('x-user-id') || DEFAULT_USER_ID;
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
