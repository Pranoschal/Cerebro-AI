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
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const prompt = `Title: ${note.title}\n\nContent:\n${note.content}`;
    const summary = await callGroqChat([
      {
        role: 'system',
        content:
          'You are an expert AI summarizer. Provide a concise, high-impact bulleted summary of key takeaways and actionable items from the provided markdown note. Keep it under 100 words. Format clearly.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { summary },
      include: { tags: true, folder: true },
    });

    return NextResponse.json({ summary, note: updatedNote });
  } catch (error: any) {
    console.error('POST /api/ai/summarize error:', error);
    return NextResponse.json({ error: error.message || 'Summarization failed' }, { status: 500 });
  }
}
