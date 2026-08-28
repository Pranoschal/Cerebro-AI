import { PrismaClient } from '@prisma/client';
import { syncNoteEmbedding } from '../lib/sync-embeddings';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial workspace notes & folders...');
  const userId = 'user_demo_123';

  // Ensure user
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: 'demo@notes.ai',
      name: 'Alex Mercer',
    },
  });

  // Create Folders
  const engineeringFolder = await prisma.folder.create({
    data: {
      userId,
      name: 'Engineering',
    },
  });

  const productFolder = await prisma.folder.create({
    data: {
      userId,
      name: 'Product & Strategy',
    },
  });

  // Create Notes
  const note1 = await prisma.note.create({
    data: {
      userId,
      title: 'Q3 Roadmap & Vector Search Architecture',
      content: `# Q3 Architecture & Vector Scaling

We are rolling out **Qdrant** as our primary vector store for all note embeddings.

### Key Objectives:
1. Low latency embedding generation using **Voyage AI** \`voyage-large-2\`.
2. Support \`QUERY\` HTTP method for semantic note searches with request bodies.
3. Integrate **Groq Llama 3** for streaming RAG completions with footnotes.

### Action Items:
- [x] Configure Prisma schema with User, Note, Tag, Folder.
- [x] Implement debounced autosave (1s).
- [ ] Benchmark top-K Qdrant payload filters.`,
      summary: '### Summary\n• Transition to Qdrant vector database for sub-100ms similarity search.\n• Integration of Voyage AI embeddings and Groq Llama 3 RAG inference.\n• Adoption of IETF QUERY method for filtered payload searches.',
      isPinned: true,
      folderId: engineeringFolder.id,
      tags: {
        create: [{ userId, name: 'architecture' }, { userId, name: 'qdrant' }, { userId, name: 'roadmap' }],
      },
    },
    include: { tags: true },
  });

  const note2 = await prisma.note.create({
    data: {
      userId,
      title: 'Meeting Notes: AI Note Taking UX & Design System',
      content: `# Design Review: Dark Mode Glassmorphism

Discussion on creating a high-impact, visual workspace:
- **Palette**: Deep slate background (\`#090d16\`), indigo/violet accents, glowing borders.
- **Interactions**: Live markdown preview, auto tag pills, real-time citation jumping.
- **RAG Drawer**: Slide-over panel enabling contextual questions scoped by tags or folder.`,
      summary: '### Summary\n• Dark glassmorphic design language with glowing borders.\n• Side-by-side Markdown editing and instant AI RAG drawer.\n• Tag and folder filtering UX refined.',
      folderId: productFolder.id,
      tags: {
        create: [{ userId, name: 'design' }, { userId, name: 'ux' }],
      },
    },
    include: { tags: true },
  });

  // Sync vector embeddings
  await syncNoteEmbedding(note1);
  await syncNoteEmbedding(note2);

  console.log('Seeding complete! 2 notes created and vector-indexed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
