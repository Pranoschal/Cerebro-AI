'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  BookOpen,
  FileText,
  ChevronRight,
  Filter,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ModelSelector from '@/components/ModelSelector';
import { authFetch } from '@/lib/api-client';

interface Citation {
  id: string;
  title: string;
  snippet: string;
  index: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your AI knowledge assistant powered by Qdrant vector retrieval. Ask me questions about your notes, concepts you’ve saved, or let me synthesize across multiple documents.',
      timestamp: new Date(),
    },
  ]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');

  // Load saved model from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cerebro_selected_model');
      if (saved) setSelectedModel(saved);
    }
  }, []);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const payload: any = {
        question: userMsg.content,
        model: selectedModel,
      };

      if (selectedFolderId) payload.folderId = selectedFolderId;
      if (selectedTag) payload.tag = selectedTag;

      const response = await authFetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
          citations: data.sources?.map((s: any, idx: number) => ({
            id: s.id,
            title: s.title,
            snippet: s.snippet,
            index: idx + 1,
          })),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const err = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I encountered an error querying your knowledge base: ${err.error || 'Request failed'}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      console.error('RAG query failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Unable to connect to the knowledge engine: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] max-w-full bg-white dark:bg-[#0b0f19] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300 text-slate-900 dark:text-slate-100">
        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-indigo-950/20 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                Ask Notes <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono">RAG</span>
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Qdrant Vector + Groq Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} align="right" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope Scroller */}
        <div className="px-4 sm:px-5 py-2 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-slate-500 dark:text-slate-400 shrink-0 font-medium text-[11px]">Scope:</span>
          <select
            value={selectedFolderId || ''}
            onChange={(e) => setSelectedFolderId(e.target.value || null)}
            className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300 text-[11px] outline-none"
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
            className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-300 text-[11px] outline-none"
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
                      ? 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 leading-relaxed ${
                    isBot
                      ? 'bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-sm dark:shadow-none'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  <div className="markdown-body text-xs sm:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Citations List if present */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
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
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 text-left transition-all group"
                          >
                            <div className="truncate min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 text-[11px] truncate">
                                [{c.index}] {c.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{c.snippet}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 shrink-0 ml-1.5" />
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
            <div className="flex gap-2.5 items-center text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />
              <span>Searching vectors and synthesizing answer via Groq...</span>
            </div>
          )}
        </div>

        {/* Input Query Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/80">
          <div className="relative flex items-center">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your notes..."
              className="w-full bg-white dark:bg-slate-900/90 rounded-2xl pl-3.5 pr-11 py-2.5 sm:py-3 border border-slate-200 dark:border-white/10 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-inner"
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
