import { NextResponse } from 'next/server';
import { fetchGroqModels, type AIModel } from '@/lib/groq-models';

export const dynamic = 'force-dynamic';

export type { AIModel };

export async function GET() {
  const result = await fetchGroqModels();

  if (result.models.length === 0) {
    return NextResponse.json(
      {
        models: [],
        source: result.source,
        defaultModel: null,
        error: result.error || 'Unable to load models from Groq',
      },
      { status: result.source === 'unavailable' ? 503 : 200 }
    );
  }

  return NextResponse.json({
    models: result.models,
    source: result.source,
    defaultModel: result.defaultModelId,
  });
}
