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
    const { noteId } = body;

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
            'Analyze the following note and generate 3 to 5 relevant, concise single-word or hyphenated category tags. Respond in JSON format: { "tags": ["tag1", "tag2", "tag3"] }',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { jsonMode: true }
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
