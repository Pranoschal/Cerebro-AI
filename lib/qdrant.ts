// Qdrant Vector Client integration with automatic In-Memory indexer fallback
import { cosineSimilarity } from './embeddings';

export interface VectorPoint {
  id: string; // Note ID
  vector: number[];
  payload: {
    userId: string;
    tags: string[];
    folderId: string | null;
    updatedAt: string;
    title: string;
  };
}

// In-memory fallback index for local dev when Qdrant cloud isn't set up yet
const inMemoryVectors = new Map<string, VectorPoint>();

export async function upsertVectorPoint(point: VectorPoint): Promise<boolean> {
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION || 'notes';

  // Always keep in-memory cache updated as local replica
  inMemoryVectors.set(point.id, point);

  if (qdrantUrl && qdrantUrl.trim() !== '') {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (qdrantApiKey) {
        headers['api-key'] = qdrantApiKey;
      }

      // 1. Ensure collection exists
      await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${collectionName}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          vectors: {
            size: point.vector.length,
            distance: 'Cosine',
          },
        }),
      }).catch(() => {});

      // 2. Upsert point
      const response = await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${collectionName}/points`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          points: [
            {
              id: point.id,
              vector: point.vector,
              payload: point.payload,
            },
          ],
        }),
      });

      return response.ok;
    } catch (err) {
      console.warn('Qdrant remote upsert failed, saved in local memory vector index:', err);
    }
  }

  return true;
}

export async function deleteVectorPoint(id: string): Promise<boolean> {
  inMemoryVectors.delete(id);
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION || 'notes';

  if (qdrantUrl && qdrantUrl.trim() !== '') {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (qdrantApiKey) headers['api-key'] = qdrantApiKey;

      await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${collectionName}/points/delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          points: [id],
        }),
      });
    } catch (e) {
      console.error('Qdrant delete error:', e);
    }
  }
  return true;
}

export interface SearchFilter {
  userId: string;
  tags?: string[];
  folderId?: string | null;
  dateRange?: { from?: string; to?: string };
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorPoint['payload'];
}

export async function searchVectors(
  queryVector: number[],
  filter: SearchFilter,
  limit = 20
): Promise<SearchResult[]> {
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const collectionName = process.env.QDRANT_COLLECTION || 'notes';

  if (qdrantUrl && qdrantUrl.trim() !== '') {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (qdrantApiKey) headers['api-key'] = qdrantApiKey;

      const mustFilters: any[] = [
        {
          key: 'userId',
          match: { value: filter.userId },
        },
      ];

      if (filter.tags && filter.tags.length > 0) {
        mustFilters.push({
          key: 'tags',
          match: { any: filter.tags },
        });
      }

      if (filter.folderId) {
        mustFilters.push({
          key: 'folderId',
          match: { value: filter.folderId },
        });
      }

      const response = await fetch(`${qdrantUrl.replace(/\/$/, '')}/collections/${collectionName}/points/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vector: queryVector,
          limit,
          filter: {
            must: mustFilters,
          },
          with_payload: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return (result.result || []).map((hit: any) => ({
          id: String(hit.id),
          score: hit.score,
          payload: hit.payload,
        }));
      }
    } catch (err) {
      console.warn('Qdrant remote search failed, falling back to local memory index:', err);
    }
  }

  // Local In-Memory cosine search over stored vectors
  const results: SearchResult[] = [];
  Array.from(inMemoryVectors.entries()).forEach(([id, pt]) => {
    // Check filter
    if (pt.payload.userId !== filter.userId) return;
    if (filter.folderId && pt.payload.folderId !== filter.folderId) return;
    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some((t) => pt.payload.tags?.includes(t));
      if (!hasMatchingTag) return;
    }

    const score = cosineSimilarity(queryVector, pt.vector);
    results.push({
      id,
      score,
      payload: pt.payload,
    });
  });


  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
