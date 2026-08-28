import { NextRequest, NextResponse } from 'next/server';
import { prisma, DEFAULT_USER_ID, ensureDemoUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await ensureDemoUser();
    const userId = req.headers.get('x-user-id') || DEFAULT_USER_ID;
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
    await ensureDemoUser();
    const userId = req.headers.get('x-user-id') || DEFAULT_USER_ID;
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
