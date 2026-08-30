import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppToaster } from '@/components/AppToaster';

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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
