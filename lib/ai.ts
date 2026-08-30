import { APICallError, generateObject, generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';
import { resolveGroqModelId } from '@/lib/groq-models';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GroqChatOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
};

const tagSuggestionSchema = z.object({
  tags: z.array(z.string()),
});

function getGroqProvider() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return createGroq({ apiKey });
}

function splitMessages(messages: ChatMessage[]): {
  system?: string;
  prompt: string;
  conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
} {
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content.trim());
  const conversationMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const system = systemParts.length > 0 ? systemParts.join('\n\n') : undefined;
  const lastUser = [...conversationMessages].reverse().find((m) => m.role === 'user');

  return {
    system,
    prompt: lastUser?.content ?? conversationMessages[conversationMessages.length - 1]?.content ?? '',
    conversationMessages,
  };
}

function formatGroqError(error: unknown): Error {
  if (APICallError.isInstance(error)) {
    const detail =
      typeof error.responseBody === 'string' ? error.responseBody.slice(0, 300) : error.message;
    return new Error(`Groq API error (${error.statusCode ?? 'unknown'}): ${detail}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Groq API request failed');
}

// Groq LLM wrapper via Vercel AI SDK for summarization, tag extraction, RAG Q&A, and note copilot
export async function callGroqChat(
  messages: ChatMessage[],
  options: GroqChatOptions = {}
): Promise<string> {
  const groqProvider = getGroqProvider();
  const modelId = await resolveGroqModelId(options.model);
  const temperature = options.temperature ?? 0.3;
  const maxOutputTokens = options.max_tokens ?? 1024;

  if (!groqProvider) {
    throw new Error(
      'GROQ_API_KEY is not configured. Add a valid key to .env to enable AI features.'
    );
  }

  try {
    const { system, prompt, conversationMessages } = splitMessages(messages);
    const model = groqProvider(modelId);

    if (options.jsonMode) {
      const { object } = await generateObject({
        model,
        schema: tagSuggestionSchema,
        system,
        prompt,
        temperature,
        maxOutputTokens,
      });
      return JSON.stringify(object);
    }

    const useConversation =
      conversationMessages.length > 1 ||
      (conversationMessages.length === 1 && conversationMessages[0].role === 'assistant');

    const { text } = await generateText({
      model,
      system,
      ...(useConversation ? { messages: conversationMessages } : { prompt }),
      temperature,
      maxOutputTokens,
    });

    if (!text?.trim()) {
      throw new Error('Groq returned an empty response');
    }

    return text;
  } catch (error) {
    const formatted = formatGroqError(error);
    console.error('Groq chat failed:', formatted.message);
    throw formatted;
  }
}
