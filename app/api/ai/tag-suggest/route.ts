import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { callGroqChat } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, model } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }

    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
      include: { tags: true },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const prompt = `Title: ${note.title}\n\nContent:\n${note.content}`;
    const result = await callGroqChat(
      [
        {
          role: 'system',
          content:
            'You are an AI metadata assistant. Analyze the note and return a JSON object with an array of 3 to 6 concise, lowercase, single-word or hyphenated relevant tags. Example response format: {"tags": ["architecture", "nextjs", "qdrant", "database"]}',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { model, jsonMode: true }
    );

    let parsedTags: string[] = [];
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed.tags)) {
        parsedTags = parsed.tags.map((t: string) => t.toLowerCase().trim().replace(/[^a-z0-9-_]/g, ''));
      }
    } catch {
      // Fallback regex extractor if JSON parse fails
      parsedTags = (result.match(/[a-zA-Z0-9_-]+/g) || []).slice(0, 4);
    }

    return NextResponse.json({ tags: parsedTags });
  } catch (error: any) {
    console.error('POST /api/ai/tag-suggest error:', error);
    return NextResponse.json({ error: error.message || 'Tag suggestion failed' }, { status: 500 });
  }
}
