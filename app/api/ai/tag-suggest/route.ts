import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { callGroqChat } from '@/lib/ai';
import { resolveGroqModelId } from '@/lib/groq-models';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, model, content, title } = body;

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

    const noteContent = typeof content === 'string' ? content : note.content;
    const noteTitle = typeof title === 'string' ? title : note.title;

    if (!noteContent.trim()) {
      return NextResponse.json({ error: 'Note content is empty' }, { status: 400 });
    }

    const modelUsed = await resolveGroqModelId(model);
    const prompt = `Title: ${noteTitle}\n\nContent:\n${noteContent}`;
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
      { model: modelUsed, jsonMode: true }
    );

    let parsedTags: string[] = [];
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed.tags)) {
        parsedTags = parsed.tags.map((t: string) => t.toLowerCase().trim().replace(/[^a-z0-9-_]/g, ''));
      }
    } catch {
      parsedTags = (result.match(/[a-zA-Z0-9_-]+/g) || []).slice(0, 4);
    }

    return NextResponse.json({ tags: parsedTags, suggestedTags: parsedTags, modelUsed });
  } catch (error: any) {
    console.error('POST /api/ai/tag-suggest error:', error);
    return NextResponse.json({ error: error.message || 'Tag suggestion failed' }, { status: 500 });
  }
}
