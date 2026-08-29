import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureUser } from '@/lib/db';

// PATCH /api/folders/:id - Rename folder
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const folder = await prisma.folder.updateMany({
      where: { id, userId },
      data: { name: name.trim() },
    });

    if (folder.count === 0) {
      return NextResponse.json({ error: 'Folder not found or unauthorized' }, { status: 404 });
    }

    const updated = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH /api/folders/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Error updating folder' }, { status: 500 });
  }
}

// DELETE /api/folders/:id - Delete folder
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;

    // Disassociate notes first so notes remain safe (folderId -> null)
    await prisma.note.updateMany({
      where: { folderId: id, userId },
      data: { folderId: null },
    });

    // Delete folder
    const deleted = await prisma.folder.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Folder not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Folder deleted successfully', id });
  } catch (error: any) {
    console.error('DELETE /api/folders/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Error deleting folder' }, { status: 500 });
  }
}
