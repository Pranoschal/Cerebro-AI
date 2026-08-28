import { NextRequest, NextResponse } from 'next/server';
import { prisma, DEFAULT_USER_ID } from '@/lib/db';
import { syncNoteEmbedding } from '@/lib/sync-embeddings';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || DEFAULT_USER_ID;
    const body = await req.json().catch(() => ({}));
    const { noteId } = body;

    if (noteId) {
      const note = await prisma.note.findFirst({
        where: { id: noteId, userId },
        include: { tags: true },
      });
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      await syncNoteEmbedding(note);
      return NextResponse.json({ success: true, count: 1 });
    }

    // Batch embed all user notes that need vector indexing
    const notes = await prisma.note.findMany({
      where: { userId, isArchived: false },
      include: { tags: true },
    });

    for (const note of notes) {
      await syncNoteEmbedding(note);
    }

    return NextResponse.json({ success: true, count: notes.length });
  } catch (error: any) {
    console.error('POST /api/ai/embed error:', error);
    return NextResponse.json({ error: error.message || 'Embedding sync failed' }, { status: 500 });
  }
}
