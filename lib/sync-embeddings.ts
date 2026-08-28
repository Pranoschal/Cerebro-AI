import { getEmbedding } from './embeddings';
import { upsertVectorPoint } from './qdrant';

export async function syncNoteEmbedding(note: {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags?: Array<{ name: string }> | string[];
  folderId?: string | null;
  updatedAt?: Date | string;
}) {
  try {
    const textToEmbed = `${note.title}\n\n${note.content}`.trim();
    if (!textToEmbed) return;

    const vector = await getEmbedding(textToEmbed);
    const tagNames = (note.tags || []).map((t) => (typeof t === 'string' ? t : t.name));

    await upsertVectorPoint({
      id: note.id,
      vector,
      payload: {
        userId: note.userId,
        tags: tagNames,
        folderId: note.folderId ?? null,
        updatedAt: note.updatedAt ? new Date(note.updatedAt).toISOString() : new Date().toISOString(),
        title: note.title,
      },
    });
  } catch (error) {
    console.error('Error syncing note embedding:', error);
  }
}
