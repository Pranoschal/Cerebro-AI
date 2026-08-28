'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  X,
  FileText,
  ChevronRight,
  Bot,
  User,
  Zap,
  Info,
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';
import ModelSelector from './ModelSelector';

interface Citation {
  index: number;
  id: string;
  title: string;
  snippet: string;
  tags?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  modelUsed?: string;
}

interface AIAskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNoteById: (noteId: string) => void;
  folders: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}

export default function AIAskPanel({
  isOpen,
  onClose,
  onSelectNoteById,
  folders,
  tags,
}: AIAskPanelProps) {
  const [question, setQuestion] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cerebro_selected_model') || 'llama-3.3-70b-versatile';
    }
    return 'llama-3.3-70b-versatile';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your RAG Knowledge Assistant. Ask any question about your thoughts, projects, or meeting notes, and I will synthesize an answer directly from your knowledge base with citations.',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      // Use QUERY method with fallback to POST
      const payload = {
        question: userMsg.content,
        scope: {
          folderId: selectedFolderId,
          tags: selectedTag ? [selectedTag] : [],
        },
        model: selectedModel,
      };

      let res: Response;
      try {
        res = await authFetch('/api/ai/ask', {
          method: 'QUERY',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await authFetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok && res.status === 405) {
        res = await authFetch('/api/ai/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          citations: data.citations || [],
          modelUsed: data.modelUsed,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const botErr: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error answering your question. Please check your notes or network connection.',
        };
        setMessages((prev) => [...prev, botErr]);
      }
    } catch (err) {
      console.error('RAG request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Dark backdrop on mobile & tablet */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] max-w-full bg-[#0b0f19] border-l border-white/10 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-indigo-950/20 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
                Ask Notes <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">RAG</span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate">Qdrant Vector + Groq Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope Scroller */}
        <div className="px-4 sm:px-5 py-2 bg-slate-950/60 border-b border-white/5 flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-slate-500 shrink-0 font-medium text-[11px]">Scope:</span>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="bg-slate-900 px-2 py-1 rounded-lg border border-white/10 text-slate-300 text-[11px] outline-none"
          >
            <option value="">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="bg-slate-900 px-2 py-1 rounded-lg border border-white/10 text-slate-300 text-[11px] outline-none"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>
                🏷️ #{t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Chat List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 text-xs sm:text-sm ${
                  isBot ? 'items-start' : 'items-end flex-row-reverse'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isBot
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 leading-relaxed ${
                    isBot
                      ? 'glass-panel text-slate-200 border-white/10'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <div className="markdown-body text-xs sm:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Citations List if present */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Cited Sources:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.citations.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onSelectNoteById(c.id);
                              onClose();
                            }}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-indigo-950/50 border border-white/5 hover:border-indigo-500/30 text-left transition-all group"
                          >
                            <div className="truncate min-w-0 flex-1">
                              <p className="font-semibold text-slate-200 group-hover:text-indigo-300 text-[11px] truncate">
                                [{c.index}] {c.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{c.snippet}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-1.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-indigo-300 bg-indigo-950/30 p-3 rounded-2xl border border-indigo-500/20 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              <span>Searching vectors and synthesizing answer via Groq...</span>
            </div>
          )}
        </div>

        {/* Input Query Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/10 bg-slate-950/80">
          <div className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your notes..."
              className="w-full bg-slate-900/90 rounded-2xl pl-3.5 pr-11 py-2.5 sm:py-3 border border-white/10 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="absolute right-1.5 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
