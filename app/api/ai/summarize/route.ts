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
    const summary = await callGroqChat(
      [
        {
          role: 'system',
          content:
            'You are an expert AI summarizer. Provide a concise, high-impact bulleted summary of key takeaways from the provided markdown note. Keep it under 100 words. Format clearly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      { model: modelUsed }
    );

    return NextResponse.json({ summary, modelUsed });
  } catch (error: any) {
    console.error('POST /api/ai/summarize error:', error);
    return NextResponse.json({ error: error.message || 'Summarization failed' }, { status: 500 });
  }
}
