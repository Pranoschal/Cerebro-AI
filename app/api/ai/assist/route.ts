import { NextRequest, NextResponse } from 'next/server';
import { callGroqChat } from '@/lib/ai';
import { ensureUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'guest_user';
    const email = req.headers.get('x-user-email') || `${userId}@cerebro.local`;
    const name = req.headers.get('x-user-name') || 'Cerebro User';

    await ensureUser(userId, email, name);

    const body = await req.json();
    const { action = 'continue', title = '', content = '', prompt = '', model } = body;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'continue':
        systemPrompt =
          'You are an expert AI co-writer and thought partner. Seamlessly continue and expand upon the user note in markdown. Maintain the existing tone, style, and formatting. Do not repeat the existing content; only output the new continuation text.';
        userPrompt = `Note Title: "${title}"\n\nCurrent Note Content:\n${content}\n\nPlease continue writing the next section or thoughts:`;
        break;

      case 'outline':
        systemPrompt =
          'You are a strategic brainstorming and outlining assistant. Generate a structured, highly actionable markdown outline or list of key concepts, questions, and action items that would fit into this note.';
        userPrompt = `Note Title: "${title}"\n\nCurrent Content:\n${content || 'Empty note'}\n\nBrainstorm a structured markdown outline with bullet points:`;
        break;

      case 'polish':
        systemPrompt =
          'You are a professional editor. Polish, refine, and improve the clarity and flow of the provided note while preserving all technical accuracy, markdown formatting, and core ideas. Return the polished version.';
        userPrompt = `Note Title: "${title}"\n\nContent to Polish:\n${content}`;
        break;

      case 'custom':
        systemPrompt =
          'You are an intelligent AI note copilot. Execute the user request specifically in the context of their note and format the response in clean, beautiful markdown.';
        userPrompt = `Note Title: "${title}"\n\nCurrent Content:\n${content}\n\nUser Request: "${prompt}"`;
        break;

      default:
        systemPrompt = 'You are a helpful AI writing assistant. Enhance the note in clean markdown.';
        userPrompt = `Title: ${title}\nContent:\n${content}`;
    }

    const generatedText = await callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model, temperature: 0.5, max_tokens: 1500 }
    );

    return NextResponse.json({
      result: generatedText,
      action,
      modelUsed: model || 'llama-3.3-70b-versatile',
    });
  } catch (err: any) {
    console.error('AI Assist error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate writing assistance' },
      { status: 500 }
    );
  }
}
