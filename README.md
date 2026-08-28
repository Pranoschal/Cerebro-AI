# Cerebro AI — Next-Gen RAG Vector Knowledge Base

![Cerebro AI](https://img.shields.io/badge/Vector%20DB-Qdrant-indigo)
![LLM-Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203-purple)
![Embeddings-Voyage](https://img.shields.io/badge/Embeddings-Voyage%20AI-blue)
![Framework-Next.js%2014](https://img.shields.io/badge/Framework-Next.js%2014-black)

**Cerebro AI** is an intelligent note-taking application and vector knowledge base. It allows users to store markdown notes, perform sub-15ms semantic vector searches with Qdrant, extract automated AI tag suggestions, and converse with their notes using Groq Llama 3 retrieval-augmented generation (RAG).

---

## ✨ Features

- 🧠 **Neural Semantic RAG Assistant**: Ask questions across your entire note library with instant source citations and grounded responses.
- ⚡ **Sub-15ms Vector Search**: Real-time 3D vector similarity matching powered by Voyage AI embeddings and Qdrant vector database.
- 🏷️ **AI Suggested Tagging**: Automated tag extraction and taxonomy suggestions powered by Groq inference.
- 📝 **Markdown Studio**: Full GitHub Flavored Markdown (GFM) split-pane editor with live preview.
- 🔐 **Stunning Glassmorphism UI**: Modern futuristic dark theme with glowing ambient lighting, dual auth tabs (Sign In / Sign Up), Google OAuth support, and quick Demo Mode.

---

## 🛠️ Tech Stack

- **Frontend / Framework**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons
- **Database / ORM**: Prisma ORM, SQLite
- **Vector Database**: Qdrant Vector Cloud (with in-memory fallback)
- **Embeddings**: Voyage AI (`voyage-2` / `voyage-large-2`)
- **LLM Reasoning**: Groq AI API (`qwen/qwen3.6-27b`, `groq/compound`)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Pranoschal/Cerebro-AI.git
cd Cerebro-AI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your-groq-api-key"
VOYAGE_API_KEY="your-voyage-api-key"
QDRANT_URL="https://your-qdrant-cluster.cloud.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"
QDRANT_COLLECTION="notes"
```

### 4. Database Setup & Dev Server
```bash
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

MIT License. Designed with ❤️ for intelligent note-taking.
