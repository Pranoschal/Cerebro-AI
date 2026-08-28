import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { searchVectors } from '@/lib/qdrant';

// Unified search logic handling both QUERY and POST methods
async function handleSearch(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body could be empty
    }

    const {
      text = '',
      filters = {},
      mode = 'semantic', // 'semantic' | 'keyword' | 'hybrid'
      limit = 20,
    } = body;

    const { tags = [], folderId = null } = filters;

    if (!text.trim()) {
      // Return recent notes if no search query
      const notes = await prisma.note.findMany({
        where: {
          userId,
          isArchived: false,
          ...(folderId ? { folderId } : {}),
          ...(tags.length > 0 ? { tags: { some: { name: { in: tags } } } } : {}),
        },
        include: { tags: true, folder: true },
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ results: notes, count: notes.length });
    }

    let noteIds: string[] = [];
    const scoreMap = new Map<string, number>();

    // 1. Semantic Search
    if (mode === 'semantic' || mode === 'hybrid') {
      const queryVector = await getEmbedding(text);
      const vectorHits = await searchVectors(
        queryVector,
        {
          userId,
          tags: tags.length > 0 ? tags : undefined,
          folderId: folderId || undefined,
        },
        limit
      );

      for (const hit of vectorHits) {
        noteIds.push(hit.id);
        scoreMap.set(hit.id, (scoreMap.get(hit.id) || 0) + hit.score * 0.7);
      }
    }

    // 2. Keyword Search
    if (mode === 'keyword' || mode === 'hybrid') {
      const keywordMatches = await prisma.note.findMany({
        where: {
          userId,
          isArchived: false,
          ...(folderId ? { folderId } : {}),
          ...(tags.length > 0 ? { tags: { some: { name: { in: tags } } } } : {}),
          OR: [
            { title: { contains: text } },
            { content: { contains: text } },
            { summary: { contains: text } },
          ],
        },
        select: { id: true },
        take: limit,
      });

      for (const item of keywordMatches) {
        if (!noteIds.includes(item.id)) {
          noteIds.push(item.id);
        }
        scoreMap.set(item.id, (scoreMap.get(item.id) || 0) + 0.5);
      }
    }

    // Fetch full note objects from Postgres
    const notes = await prisma.note.findMany({
      where: {
        id: { in: noteIds },
        userId,
        isArchived: false,
      },
      include: {
        tags: true,
        folder: true,
      },
    });

    // Sort by combined relevance score
    const sortedNotes = notes
      .map((n) => ({
        ...n,
        relevanceScore: scoreMap.get(n.id) || 0.1,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      results: sortedNotes,
      mode,
      count: sortedNotes.length,
      methodUsed: req.method,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 });
  }
}

// Export POST as primary handler with full support for body payloads
export async function POST(req: NextRequest) {
  return handleSearch(req);
}

// Export GET with searchParams
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('q') || '';
  const mode = searchParams.get('mode') || 'semantic';
  const fakeReq = {
    ...req,
    method: 'GET',
    json: async () => ({ text, mode, filters: {} }),
  } as unknown as NextRequest;
  return handleSearch(fakeReq);
}
