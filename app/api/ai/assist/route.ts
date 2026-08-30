import { NextRequest, NextResponse } from 'next/server';
import { callGroqChat } from '@/lib/ai';
import { resolveGroqModelId } from '@/lib/groq-models';
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
        if (noteContent.trim()) {
          systemPrompt =
            'You are an expert AI co-writer. The user already has note content. Write ONLY the next markdown content that continues naturally from where the note ends. Follow the topic in the existing body — ignore the note title if it does not match the content. Do NOT repeat, rewrite, paraphrase, or reproduce any existing text. Do NOT return the full note. Output only new paragraphs, sections, bullet points, or code blocks. No meta-commentary or conversational filler.';
          userPrompt = `Existing note:\n${noteContent}\n\nWrite the next continuation:`;
        } else {
          systemPrompt =
            'You are an expert AI co-writer. Write the opening markdown content for a new note. The title is a hint only. Output only the note body — no title line, no meta-commentary, no conversational intro.';
          userPrompt = `Write opening content for a note${title ? ` about "${title}"` : ''}:`;
        }
        break;

      case 'outline':
        systemPrompt =
          'You are a strategic note architect. Create a clean markdown outline with section headers that best fit the content. ' +
          'Choose sections dynamically based on what the note actually contains — only include "Key Takeaways" if there are meaningful insights to extract, and only include "Action Items" if the note implies tasks, decisions, or next steps. ' +
          'Do not force either section if it does not naturally apply; a simple list, reference, or log-style note may need neither. ' +
          'When the note already has content, output ONLY a new outline section to add below it — do NOT reproduce, rewrite, or remove the existing note text. ' +
          'Do NOT repeat the original prose as paragraphs. Use headers and bullet points only. ' +
          'The user request and note body define the subject — the note title field may be outdated, so ignore it when it conflicts with the actual topic. ' +
          'Output ONLY the outline markdown. No meta-commentary, no "Note Context" sections, no explanations about restructuring, and do not mention unrelated topics (e.g. RAG) unless the user content is about that topic.';
        userPrompt = noteContent.trim()
          ? `The note below will be kept as-is. Create a separate outline section that organizes its ideas.\n\nExisting note:\n${noteContent}\n\nOutput only the outline section (not the original text):`
          : `Create a structured outline for a note titled "${title || 'Untitled'}".\n\nGenerate the outline:`;
        break;

      case 'polish':
        systemPrompt =
          'You are a senior technical editor. Polish, refine, and improve the grammar, sentence structure, tone, and flow of the provided note while preserving all core facts, technical details, and code snippets. Return the full polished note in markdown.';
        userPrompt = `Note Title: "${title}"\n\nContent to Polish:\n${noteContent}`;
        break;

      case 'custom':
        systemPrompt =
          'You are an expert AI note-taking assistant. Follow the user request as the primary instruction — it defines the topic. The note title field is just an app label and may be wrong or outdated; never let a mismatched title override the user request. Write or edit the note content in clean markdown. Do NOT output meta-commentary (no "Note Context", no "Executive Summary" about the note itself, no explanations of what you are doing). Do not mention RAG, vector search, or this app unless the user explicitly asks about those. Output ONLY the final markdown note content.';
        userPrompt = noteContent.trim()
          ? `User Request: "${prompt || 'Enhance and expand note content'}"\n\nExisting note content:\n${noteContent}\n\nApply the request and return the updated note:`
          : `User Request: "${prompt || 'Write useful note content'}"\n\nThe note body is empty. Write the note content for this request. Do not use the app note title unless it matches the request.${title ? ` (App label: "${title}" — ignore if unrelated)` : ''}`;
        break;

      default:
        systemPrompt = 'You are a helpful AI writing assistant. Enhance the note in clean markdown.';
        userPrompt = `Title: ${title}\nContent:\n${noteContent}`;
    }

    const modelUsed = await resolveGroqModelId(model);

    const generatedText = await callGroqChat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: modelUsed, temperature: 0.5, max_tokens: 3000 }
    );

    return NextResponse.json({
      result: generatedText,
      action,
      modelUsed,
    });
  } catch (err: any) {
    console.error('AI Assist error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate writing assistance' },
      { status: 500 }
    );
  }
}
