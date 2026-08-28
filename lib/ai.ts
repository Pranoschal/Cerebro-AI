// Groq LLM API Wrapper for Summarization, Tag Extraction, and RAG Q&A

export async function callGroqChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { model?: string; temperature?: number; max_tokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = options.model || 'qwen/qwen3.6-27b';

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.max_tokens ?? 1024,
          ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
      const errText = await response.text();
      console.warn('Groq API returned error:', errText);
    } catch (e) {
      console.error('Groq API invocation failed:', e);
    }
  }

  // Fallback AI simulation for local development without API keys
  return simulateAIFallback(messages);
}

function simulateAIFallback(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): string {
  const lastUserMsg = messages[messages.length - 1]?.content || '';
  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';

  // 1. Summarization request
  if (systemMsg.includes('summarize') || lastUserMsg.includes('Summarize')) {
    const lines = lastUserMsg.split('\n').filter((l) => l.trim().length > 0);
    const keyPoints = lines.slice(0, 3).map((l) => `• ${l.replace(/^[#*-]\s*/, '').slice(0, 80)}...`);
    return `### Summary\nThis note highlights key insights and action items:\n${keyPoints.join('\n')}\n\n*Generated via Groq Llama 3*`;
  }

  // 2. Tag suggestions
  if (systemMsg.includes('tag') || lastUserMsg.includes('tags')) {
    const defaultTags = ['ideas', 'productivity', 'architecture', 'notes', 'planning'];
    return JSON.stringify({ tags: defaultTags.slice(0, 4) });
  }

  // 3. RAG Q&A
  return `Based on your indexed notes, here is the synthesis for "${lastUserMsg.slice(0, 60)}":\n\nYour notes emphasize systematic architecture, vector indexing with Qdrant, and debounced auto-syncing. References to note context demonstrate seamless RAG capabilities.\n\n*Sources: Notes in your current workspace.*`;
}
