// Embedding generation helper with Voyage AI and deterministic fallback embedding simulator

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: [text],
          model: 'voyage-large-2',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.[0]?.embedding) {
          return data.data[0].embedding;
        }
      }
      console.warn('Voyage API returned non-ok status, falling back to vector generator');
    } catch (err) {
      console.error('Voyage API error, using fallback embedding:', err);
    }
  }

  // Deterministic 128-dim dense embedding generator based on text hashing & semantic token distribution
  return generateDeterministicEmbedding(text);
}

function generateDeterministicEmbedding(text: string, dimensions = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase();
  
  // Basic n-gram and word frequency feature hashing
  const words = normalized.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1.0;

    // Character 3-grams
    if (word.length >= 3) {
      for (let j = 0; j <= word.length - 3; j++) {
        const trigram = word.substring(j, j + 3);
        let triHash = 0;
        for (let k = 0; k < 3; k++) {
          triHash = (triHash << 5) - triHash + trigram.charCodeAt(k);
          triHash |= 0;
        }
        const triIdx = Math.abs(triHash) % dimensions;
        vector[triIdx] += 0.5;
      }
    }
  }

  // Normalize to unit vector for cosine similarity
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm;
    }
  } else {
    vector[0] = 1.0;
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
