import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureUser } from '@/lib/db';
import { syncNoteEmbedding } from '@/lib/sync-embeddings';

// GET /api/notes - List notes with optional filters (folderId, tag, isArchived, isPinned, cursor, limit)
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

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const isArchived = searchParams.get('isArchived') === 'true';
    const isPinned = searchParams.get('isPinned') === 'true' ? true : undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cursor = searchParams.get('cursor');

    const where: any = {
      userId,
      isArchived,
    };

    if (isPinned !== undefined) where.isPinned = isPinned;
    if (folderId) where.folderId = folderId;
    if (tag) {
      where.tags = {
        some: { name: tag },
      };
    }

    const notes = await prisma.note.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
      include: {
        tags: true,
        folder: true,
      },
    });

    let nextCursor: string | null = null;
    if (notes.length > limit) {
      const nextItem = notes.pop();
      nextCursor = nextItem?.id || null;
    }

    return NextResponse.json({ notes, nextCursor });
  } catch (error: any) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes - Create new note
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

    const body = await req.json();
    const { title = 'Untitled Note', content = '', folderId = null, tags = [], isPinned = false } = body;

    // Connect or create tags
    const tagConnectOrCreate = Array.isArray(tags)
      ? tags.map((tagName: string) => ({
          where: { userId_name: { userId, name: tagName.trim() } },
          create: { userId, name: tagName.trim() },
        }))
      : [];

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content,
        folderId,
        isPinned,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        tags: true,
        folder: true,
      },
    });

    // Asynchronously trigger embedding generation
    syncNoteEmbedding(note).catch(console.error);

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create note' }, { status: 500 });
  }
}
