import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { syncNoteEmbedding } from '@/lib/sync-embeddings';
import { deleteVectorPoint } from '@/lib/qdrant';

// GET /api/notes/:id - Get single note
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        tags: true,
        folder: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error getting note' }, { status: 500 });
  }
}

// PATCH /api/notes/:id - Partial update note
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const { title, content, summary, isPinned, isArchived, folderId, tags } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (folderId !== undefined) updateData.folderId = folderId;

    if (Array.isArray(tags)) {
      updateData.tags = {
        set: [], // Clear existing relations
        connectOrCreate: tags.map((t: string) => ({
          where: { userId_name: { userId, name: t.trim() } },
          create: { userId, name: t.trim() },
        })),
      };
    }

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        tags: true,
        folder: true,
      },
    });

    // Re-sync embedding in vector store if title/content/tags changed
    if (title !== undefined || content !== undefined || tags !== undefined || folderId !== undefined) {
      syncNoteEmbedding(note).catch(console.error);
    }

    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating note' }, { status: 500 });
  }
}

// DELETE /api/notes/:id - Archive or hard delete note
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      await prisma.note.delete({
        where: { id },
      });
      await deleteVectorPoint(id);
      return NextResponse.json({ message: 'Note permanently deleted' });
    } else {
      // Soft-delete / archive
      const note = await prisma.note.update({
        where: { id },
        data: { isArchived: true },
      });
      return NextResponse.json({ message: 'Note archived', note });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting note' }, { status: 500 });
  }
}
