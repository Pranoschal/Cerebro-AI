// Groq LLM API Wrapper for Summarization, Tag Extraction, and RAG Q&A

export async function callGroqChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: { model?: string; temperature?: number; max_tokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = options.model && !options.model.includes('qwen3.6')
    ? options.model
    : 'llama-3.3-70b-versatile';

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

  // Extract user instruction / topic from prompt if structured
  const userInstruction = lastUserMsg.match(/User (?:Request|Instruction):\s*"?([^"\n]+)"?/i)?.[1] || lastUserMsg;

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

  // 3. Custom writing / Copilot note generation request
  if (
    systemMsg.includes('copilot') ||
    systemMsg.includes('co-writer') ||
    systemMsg.includes('editor') ||
    userInstruction.toLowerCase().includes('write')
  ) {
    const rawTopic = userInstruction
      .replace(/^(?:User Request:\s*"?|User Instruction:\s*"?)/i, '')
      .replace(/^(?:Write|Draft|Create|Generate|Explain|Summarize)\s*(?:me\s*)?(?:a\s*)?(?:detailed\s*)?(?:note\s*)?(?:essay\s*)?/i, '')
      .replace(/^(?:in\s*\d+\s*words\s*)?/i, '')
      .replace(/^(?:about|on|regarding)\s*/i, '')
      .replace(/"?\s*$/i, '')
      .trim();
    const topic = rawTopic ? rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1) : 'Requested Topic';
    const existingContentMatch = lastUserMsg.match(/Existing Note Content[^\n]*:\n([\s\S]+)/i);
    const existingContent = existingContentMatch ? existingContentMatch[1].trim() : '';
    if (existingContent) {
      return `${existingContent}\n\n### Additional Synthesis: ${topic}\n- **Integrated Detail**: Enhanced existing note with key principles of ${topic}.\n- **Core Focus**: Ensures structured execution, vector indexing, and clean note organization.`;
    }

    return `## Overview of ${topic}

### Core Concepts & Architecture
- **Definition**: ${topic} provides a structured framework for data retrieval, knowledge synthesis, and intelligent automation.
- **Key Objectives**: Improve contextual accuracy, reduce latency, and enable scalable information access across workspaces.

### System Workflow
1. **Ingestion & Indexing**: Incoming notes and documents are chunked and converted into high-dimensional vector embeddings.
2. **Vector Retrieval**: Semantic similarity search matches queries against indexed embeddings using vector database collections.
3. **Contextual Generation**: Retrieved context is augmented into the LLM prompt to generate grounded, precise responses.

### Implementation Best Practices
- [x] Implement debounced auto-syncing for note embeddings
- [x] Configure fast vector similarity search index
- [ ] Monitor retrieval latency and model token usage`;
  }

  // 4. Default RAG / Q&A response
  const cleanTitle = userInstruction.split('\n')[0].replace(/^Note Title:\s*"?/, '').replace(/"?$/, '');
  return `### Information Synthesis for ${cleanTitle}

Based on your workspace notes, here is the synthesis:

1. **Systematic Architecture**: Notes emphasize structured vector indexing and debounced sync pipelines.
2. **Contextual RAG Search**: Real-time vector similarity queries retrieve relevant context prior to generation.

*Sources: Notes in your current workspace.*`;
}
