export interface AIModel {
  id: string;
  name: string;
  developer?: string;
  context_window?: number;
  description?: string;
  badge?: string;
}

interface GroqModelRecord {
  id: string;
  owned_by?: string;
  context_window?: number;
  active?: boolean;
}

interface GroqModelsCache {
  models: AIModel[];
  defaultModelId: string;
  source: 'groq-api' | 'unavailable';
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let modelsCache: GroqModelsCache | null = null;

function getApiKey(): string | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  return apiKey || null;
}

function isChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  return (
    !lower.includes('whisper') &&
    !lower.includes('guard') &&
    !lower.includes('tts') &&
    !lower.includes('orpheus')
  );
}

function formatModelDisplay(record: GroqModelRecord): AIModel {
  const id = record.id;
  const shortId = id.includes('/') ? id.split('/').slice(1).join('/') : id;
  const readableName = shortId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  let badge: string | undefined;
  const lower = id.toLowerCase();
  if (lower.includes('120b') || lower.includes('70b')) {
    badge = 'Recommended';
  } else if (lower.includes('instant') || lower.includes('mini') || lower.includes('8b') || lower.includes('7b')) {
    badge = 'Fast';
  } else if (lower.includes('qwen')) {
    badge = 'Smart';
  }

  return {
    id,
    name: readableName,
    developer: record.owned_by || 'Groq',
    context_window: record.context_window,
    badge,
  };
}

function scoreDefaultModel(id: string): number {
  const lower = id.toLowerCase();
  let score = 0;

  if (lower.includes('gpt-oss-120b')) score += 100;
  if (lower.includes('gpt-oss-20b')) score += 80;
  if (lower.includes('qwen3')) score += 70;
  if (lower.includes('llama-3.3-70b')) score += 90;
  if (lower.includes('llama-3.1-8b-instant')) score += 60;
  if (lower.includes('mixtral')) score += 50;
  if (lower.includes('70b')) score += 40;
  if (lower.includes('27b')) score += 35;
  if (lower.includes('compound')) score += 10;
  if (lower.includes('7b')) score += 5;

  return score;
}

export function pickDefaultModel(models: AIModel[]): string | null {
  if (models.length === 0) return null;
  return [...models].sort((a, b) => scoreDefaultModel(b.id) - scoreDefaultModel(a.id))[0].id;
}

export function isModelAvailable(modelId: string, models: AIModel[]): boolean {
  return models.some((model) => model.id === modelId);
}

export async function fetchGroqModels(options: { forceRefresh?: boolean } = {}): Promise<{
  models: AIModel[];
  defaultModelId: string | null;
  source: 'groq-api' | 'unavailable';
  error?: string;
}> {
  const now = Date.now();
  if (!options.forceRefresh && modelsCache && now - modelsCache.fetchedAt < CACHE_TTL_MS) {
    return {
      models: modelsCache.models,
      defaultModelId: modelsCache.defaultModelId,
      source: modelsCache.source,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      models: [],
      defaultModelId: null,
      source: 'unavailable',
      error: 'GROQ_API_KEY is not configured',
    };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq models API error:', response.status, errText.slice(0, 200));
      return {
        models: [],
        defaultModelId: null,
        source: 'unavailable',
        error: `Groq models API error (${response.status})`,
      };
    }

    const data = await response.json();
    const records: GroqModelRecord[] = Array.isArray(data.data) ? data.data : [];

    const models = records
      .filter((record) => record.id && record.active !== false && isChatModel(record.id))
      .map(formatModelDisplay)
      .sort((a, b) => scoreDefaultModel(b.id) - scoreDefaultModel(a.id));

    const defaultModelId = pickDefaultModel(models);

    if (models.length === 0 || !defaultModelId) {
      return {
        models: [],
        defaultModelId: null,
        source: 'unavailable',
        error: 'No chat models available for this Groq API key',
      };
    }

    modelsCache = {
      models,
      defaultModelId,
      source: 'groq-api',
      fetchedAt: now,
    };

    return {
      models,
      defaultModelId,
      source: 'groq-api',
    };
  } catch (error) {
    console.error('Failed to fetch Groq models:', error);
    return {
      models: [],
      defaultModelId: null,
      source: 'unavailable',
      error: error instanceof Error ? error.message : 'Failed to fetch Groq models',
    };
  }
}

export async function resolveGroqModelId(requestedModel?: string): Promise<string> {
  const { models, defaultModelId, error } = await fetchGroqModels();

  if (!defaultModelId || models.length === 0) {
    throw new Error(error || 'No Groq models available. Check your GROQ_API_KEY.');
  }

  if (requestedModel?.trim()) {
    if (isModelAvailable(requestedModel, models)) {
      return requestedModel;
    }

    console.warn(
      `Requested Groq model "${requestedModel}" is unavailable. Using "${defaultModelId}" instead.`
    );
  }

  return defaultModelId;
}
