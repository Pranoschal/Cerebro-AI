'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Tag,
  Folder,
  Eye,
  Edit3,
  Check,
  RotateCw,
  Plus,
  X,
  Clock,
  Pin,
  Trash2,
  Share2,
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';

interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  isPinned: boolean;
  isArchived: boolean;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  tags?: Array<{ id: string; name: string }>;
  updatedAt: string;
}

interface NoteEditorProps {
  note: Note | null;
  folders: Array<{ id: string; name: string }>;
  availableTags: Array<{ id: string; name: string }>;
  onUpdateNote: (updated: Note) => void;
  onDeleteNote: (id: string) => void;
}

export default function NoteEditor({
  note,
  folders,
  availableTags,
  onUpdateNote,
  onDeleteNote,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced'>('saved');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const initialLoadRef = useRef(true);

  // Sync state when note prop changes
  useEffect(() => {
    if (note) {
      initialLoadRef.current = true;
      setTitle(note.title);
      setContent(note.content || '');
      setSummary(note.summary || null);
      setFolderId(note.folderId || null);
      setTags(note.tags ? note.tags.map((t) => t.name) : []);
      setSaveStatus('saved');
    }
  }, [note?.id]);

  // Debounced Autosave (1000ms delay)
  useEffect(() => {
    if (!note) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            summary,
            folderId,
            tags,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          onUpdateNote(updated);
          setSaveStatus('synced');
          setTimeout(() => setSaveStatus('saved'), 2000);
        }
      } catch (err) {
        console.error('Autosave failed:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, content, summary, folderId, tags]);

  // AI Summarize Action
  const handleSummarize = async () => {
    if (!note) return;
    setIsSummarizing(true);
    try {
      const res = await authFetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        if (data.note) onUpdateNote(data.note);
      }
    } catch (e) {
      console.error('Summarize failed:', e);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Tag Suggestion Action
  const handleSuggestTags = async () => {
    if (!note) return;
    setIsSuggestingTags(true);
    try {
      const res = await authFetch('/api/ai/tag-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tags)) {
          const merged = Array.from(new Set([...tags, ...data.tags]));
          setTags(merged);
        }
      }
    } catch (e) {
      console.error('Tag suggestion failed:', e);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="w-16 h-16 rounded-3xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4 text-indigo-400">
          <Edit3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-300">Select or Create a Note</h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select a note from the left list or create a fresh workspace to start capturing thoughts and querying with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]/80 backdrop-blur-md">
      {/* Top Header & AI Toolbar */}
      <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 glass-panel">
        {/* Status Indicators & Metadata selector */}
        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
              saveStatus === 'saving'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : saveStatus === 'synced'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-white/5'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <RotateCw className="w-3 h-3 animate-spin" /> Saving...
              </>
            ) : saveStatus === 'synced' ? (
              <>
                <Check className="w-3 h-3" /> Vector Synced
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-slate-500" /> Saved
              </>
            )}
          </span>

          {/* Folder Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/5 text-xs text-slate-300">
            <Folder className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="bg-transparent border-none outline-none text-slate-200 cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                No Folder
              </option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-slate-200">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Triggers & View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Generate AI summary via Groq Llama 3"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-indigo-400'}`} />
            {isSummarizing ? 'Summarizing...' : 'AI Summary'}
          </button>

          <button
            onClick={handleSuggestTags}
            disabled={isSuggestingTags}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Suggest tags with LLM"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            {isSuggestingTags ? 'Extracting...' : 'Auto Tag'}
          </button>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Edit Markdown"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:block px-2 py-1 rounded-lg ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview Markdown"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Title & Tags Bar */}
      <div className="px-8 pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note..."
          className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-extrabold text-white placeholder-slate-600 tracking-tight"
        />

        {/* Tags input & chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-300 font-medium group"
            >
              #{t}
              <button
                onClick={() => handleRemoveTag(t)}
                className="text-indigo-400 hover:text-rose-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag (press Enter)..."
              className="bg-transparent border-none outline-none text-slate-300 placeholder-slate-600 w-36"
            />
          </div>
        </div>

        {/* AI Summary Highlight Panel */}
        {summary && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 backdrop-blur-md relative group">
            <div className="flex items-center justify-between font-semibold text-indigo-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Executive Summary
              </span>
              <button
                onClick={() => setSummary(null)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Dismiss summary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="leading-relaxed whitespace-pre-line text-slate-300">{summary}</p>
          </div>
        )}
      </div>

      {/* Editor & Preview Split Pane */}
      <div className="flex-1 flex overflow-hidden px-8 pb-6 pt-2 gap-6">
        {/* Editor TextArea */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="flex-1 flex flex-col h-full">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts in Markdown (e.g. # Architecture, - Points, `code`)..."
              className="w-full h-full bg-slate-950/40 p-4 rounded-2xl border border-white/5 focus:border-indigo-500/50 outline-none text-slate-200 placeholder-slate-600 font-mono text-sm leading-relaxed resize-none transition-all shadow-inner"
            />
          </div>
        )}

        {/* Markdown Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex-1 flex flex-col h-full bg-slate-950/20 p-5 rounded-2xl border border-white/5 overflow-y-auto">
            <div className="markdown-body">
              {content.trim() ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p className="text-slate-600 italic">Preview will appear here...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
