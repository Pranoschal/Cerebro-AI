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
    const { action = 'continue', title = '', content = '', currentContent = '', prompt = '', model } = body;
    const noteContent = content || currentContent || '';

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'continue':
        systemPrompt =
          'You are an expert AI co-writer. Continue and expand upon the existing note content seamlessly in markdown. Synthesize existing concepts and extend them with detailed explanations, technical context, and relevant next steps. Return the complete updated note content.';
        userPrompt = `Note Title: "${title}"\n\nCurrent Note Content:\n${noteContent || '(Empty note)'}\n\nPlease expand and continue writing this note:`;
        break;

      case 'outline':
        systemPrompt =
          'You are a strategic note architect. Analyze the existing note content and transform or extend it into a clean, well-structured, highly readable markdown outline with clear section headers, key takeaways, and action items.';
        userPrompt = `Note Title: "${title}"\n\nCurrent Content:\n${noteContent || '(Empty note)'}\n\nGenerate a structured markdown outline incorporating existing ideas and new insights:`;
        break;

      case 'polish':
        systemPrompt =
          'You are a senior technical editor. Polish, refine, and improve the grammar, sentence structure, tone, and flow of the provided note while preserving all core facts, technical details, and code snippets. Return the full polished note in markdown.';
        userPrompt = `Note Title: "${title}"\n\nContent to Polish:\n${noteContent}`;
        break;

      case 'custom':
        systemPrompt =
          'You are an expert AI note-taking assistant and editor. Your task is to modify, rewrite, expand, or refactor the existing note content according to the user request. DO NOT simply append text to the end. Integrate the requested changes smoothly directly into the existing text, maintaining clean markdown formatting, proper headings, bullet points, and code blocks where appropriate. Do not include chat intro/outro, conversational filler, or system prefixes. Output ONLY the updated, complete markdown note content.';
        userPrompt = `User Request: "${prompt || 'Enhance and expand note content'}"\nNote Title: "${title}"${
          noteContent ? `\n\nExisting Note Content to work on:\n${noteContent}` : ''
        }`;
        break;

      default:
        systemPrompt = 'You are a helpful AI writing assistant. Enhance the note in clean markdown.';
        userPrompt = `Title: ${title}\nContent:\n${noteContent}`;
    }

    const generatedText = await callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model, temperature: 0.5, max_tokens: 3000 }
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
