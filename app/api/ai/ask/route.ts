import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getEmbedding } from '@/lib/embeddings';
import { searchVectors } from '@/lib/qdrant';
import { callGroqChat } from '@/lib/ai';

// Core RAG logic: Retrieve top-K relevant notes via vector embeddings and synthesize answer with citations
async function handleAskRAG(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty
    }

    const { question = '', scope = {} } = body;
    const { folderId, tags = [] } = scope;

    if (!question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // 1. Embed query
    const queryVector = await getEmbedding(question);

    // 2. Vector search via Qdrant / in-memory index
    const vectorHits = await searchVectors(
      queryVector,
      {
        userId,
        folderId: folderId || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      5
    );

    const noteIds = vectorHits.map((h) => h.id);

    // 3. Retrieve full note content from database
    let sourceNotes: any[] = [];
    if (noteIds.length > 0) {
      sourceNotes = await prisma.note.findMany({
        where: {
          id: { in: noteIds },
          userId,
          isArchived: false,
        },
        include: { tags: true, folder: true },
      });
    } else {
      // If no vector hits, fetch up to 3 recent notes
      sourceNotes = await prisma.note.findMany({
        where: { userId, isArchived: false },
        take: 3,
        orderBy: { updatedAt: 'desc' },
        include: { tags: true, folder: true },
      });
    }

    // 4. Build Augmented Context for Groq LLM
    const contextBlocks = sourceNotes
      .map(
        (n, idx) =>
          `[Source #${idx + 1} | Note ID: ${n.id} | Title: "${n.title}"]\n${n.content.slice(0, 1500)}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are an intelligent knowledge assistant that answers user questions exclusively using their personal notes provided in context.

Guidelines:
1. Answer the question clearly, concisely, and accurately based on the context.
2. Whenever you use information from a note, cite it using Markdown footnote format or explicit citations like [Note: "Note Title" (#SourceNumber)].
3. If the context does not contain enough information to answer the question, state politely what is missing and what you found in the closest notes.
4. Keep the tone helpful, sharp, and structured.`;

    const userPrompt = `Context Notes:\n${contextBlocks || 'No notes found in scope.'}\n\nUser Question: "${question}"`;

    const answer = await callGroqChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const citations = sourceNotes.map((n, idx) => ({
      index: idx + 1,
      id: n.id,
      title: n.title,
      summary: n.summary,
      snippet: n.content.slice(0, 140) + '...',
      tags: n.tags.map((t: any) => t.name),
    }));

    return NextResponse.json({
      answer,
      citations,
      question,
      modelUsed: 'Groq Llama 3 (RAG)',
    });
  } catch (error: any) {
    console.error('Ask RAG error:', error);
    return NextResponse.json({ error: error.message || 'RAG query failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleAskRAG(req);
}
