import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface AIModel {
  id: string;
  name: string;
  developer?: string;
  context_window?: number;
  description?: string;
  badge?: string;
}

const FALLBACK_MODELS: AIModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 (70B)',
    developer: 'Meta',
    context_window: 131072,
    badge: 'Recommended',
    description: 'Deep reasoning & high intelligence for complex notes',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 (8B Instant)',
    developer: 'Meta',
    context_window: 131072,
    badge: 'Fastest',
    description: 'Sub-100ms lightning responses for quick Q&A',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 (70B Versatile)',
    developer: 'Meta',
    context_window: 131072,
    badge: 'Recommended',
    description: 'High intelligence & structured synthesis for complex notes',
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    developer: 'Mistral AI',
    context_window: 32768,
    description: 'Large 32k context window for long documents',
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 (9B)',
    developer: 'Google',
    context_window: 8192,
    description: 'High-accuracy structured outputs and summaries',
  },
];

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.data)) {
          // Filter out audio / non-chat models (e.g. whisper, prompt-guard)
          const validModels: AIModel[] = data.data
            .filter((m: any) => {
              const id = m.id.toLowerCase();
              return (
                m.active !== false &&
                !id.includes('whisper') &&
                !id.includes('guard') &&
                !id.includes('tts')
              );
            })
            .map((m: any) => {
              let name = m.id;
              let badge: string | undefined = undefined;

              if (m.id.includes('llama-3.3-70b')) {
                name = 'Llama 3.3 (70B)';
                badge = 'Recommended';
              } else if (m.id.includes('llama-3.1-8b-instant') || m.id.includes('llama-3.1-8b')) {
                name = 'Llama 3.1 (8B Instant)';
                badge = 'Fastest';
              } else if (m.id.includes('qwen')) {
                name = `Qwen (${m.id.replace('qwen/', '')})`;
                badge = 'Smart';
              } else if (m.id.includes('mixtral')) {
                name = 'Mixtral 8x7B';
              } else if (m.id.includes('gemma')) {
                name = 'Gemma 2 (9B)';
              } else if (m.id.includes('llama3-70b')) {
                name = 'Llama 3 (70B)';
              } else if (m.id.includes('llama3-8b')) {
                name = 'Llama 3 (8B)';
              }

              return {
                id: m.id,
                name,
                developer: m.owned_by || 'Groq',
                context_window: m.context_window,
                badge,
              };
            });

          if (validModels.length > 0) {
            return NextResponse.json({
              models: validModels,
              source: 'groq-api',
              defaultModel: validModels[0].id,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch models from Groq API:', err);
    }
  }

  // Return curated fallback list if API is unreachable or returns error
  return NextResponse.json({
    models: FALLBACK_MODELS,
    source: 'default-catalog',
    defaultModel: 'llama-3.3-70b-versatile',
  });
}
