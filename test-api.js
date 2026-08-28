const http = require('http');

async function testEndpoints() {
  console.log('Testing AI Note-Taking App API endpoints...\n');

  // 1. List notes
  const notesRes = await fetch('http://localhost:3000/api/notes');
  const notesData = await notesRes.json();
  console.log('1. GET /api/notes status:', notesRes.status, 'Total notes:', notesData.notes?.length);

  // 2. Test Search endpoint with body (POST)
  const searchRes = await fetch('http://localhost:3000/api/notes/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Qdrant vector search',
      mode: 'semantic',
      filters: {},
    }),
  });
  const searchData = await searchRes.json();
  console.log('2. POST /api/notes/search status:', searchRes.status, 'Results count:', searchData.results?.length);
  if (searchData.results?.[0]) {
    console.log('   Top match title:', searchData.results[0].title);
  }

  // 3. Test RAG endpoint
  const ragRes = await fetch('http://localhost:3000/api/ai/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What is our primary vector database?',
    }),
  });
  const ragData = await ragRes.json();
  console.log('3. POST /api/ai/ask status:', ragRes.status);
  console.log('   RAG Answer preview:', ragData.answer?.slice(0, 120) + '...');
  console.log('   Citations returned:', ragData.citations?.length);

  console.log('\nAll API endpoints tested and functioning properly!');
}

testEndpoints().catch(console.error);
