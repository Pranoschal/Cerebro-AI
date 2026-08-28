import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cerebro — AI Note Taking & RAG Knowledge Base',
  description: 'Next-generation note-taking application powered by Qdrant vector search, Voyage AI embeddings, and Groq Llama 3 inference.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
