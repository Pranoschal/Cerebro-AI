'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ArrowLeft,
  Save,
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';
import ModelSelector from './ModelSelector';

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
  onBack?: () => void;
}

export default function NoteEditor({
  note,
  folders,
  availableTags,
  onUpdateNote,
  onDeleteNote,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('edit');
  
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cerebro_selected_model') || 'llama-3.3-70b-versatile';
    }
    return 'llama-3.3-70b-versatile';
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const initialLoadRef = useRef(true);

  // Set default view mode based on screen width on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) {
        setViewMode('split');
      } else {
        setViewMode('edit');
      }
    }
  }, []);

  // Sync state when note prop changes
  useEffect(() => {
    if (note) {
      initialLoadRef.current = true;
      setTitle(note.title || '');
      setContent(note.content || '');
      setSummary(note.summary || null);
      setFolderId(note.folderId || null);
      setTags(note.tags ? note.tags.map((t) => t.name) : []);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 50);
    }
  }, [note?.id]);

  // Track unsaved changes when user types or changes metadata
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialLoadRef.current) setHasUnsavedChanges(true);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!initialLoadRef.current) setHasUnsavedChanges(true);
  };

  const handleFolderChange = (val: string | null) => {
    setFolderId(val);
    if (!initialLoadRef.current) setHasUnsavedChanges(true);
  };

  // Manual Save Function
  const handleSaveNote = useCallback(async () => {
    if (!note || saveStatus === 'saving') return;
    setSaveStatus('saving');

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
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus('saved'), 2000);
      } else {
        console.error('Failed to save note');
        setSaveStatus('saved');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('saved');
    }
  }, [note, title, content, summary, folderId, tags, saveStatus, onUpdateNote]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveNote]);

  // AI Summarize Action
  const handleSummarize = async () => {
    if (!note) return;
    setIsSummarizing(true);
    try {
      const res = await authFetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id, model: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setHasUnsavedChanges(true);
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
        body: JSON.stringify({ noteId: note.id, model: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tags)) {
          const merged = Array.from(new Set([...tags, ...data.tags]));
          setTags(merged);
          setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 min-h-[50vh]">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-slate-900/60 border border-white/5 flex items-center justify-center mb-4 text-indigo-400">
          <Edit3 className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-slate-300">Select or Create a Note</h2>
        <p className="text-xs md:text-sm text-slate-500 max-w-sm mt-1 px-4">
          Choose a note from the list or create a fresh workspace to start capturing thoughts and querying with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]/80 backdrop-blur-md">
      {/* Top Header & AI Toolbar */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 glass-panel">
        {/* Left: Mobile Back Button & Save Action / Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex items-center gap-1 p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10"
              title="Back to notes list"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-[11px]">Notes</span>
            </button>
          )}

          {/* EXPLICIT SAVE BUTTON */}
          <button
            onClick={handleSaveNote}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 scale-105'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
            }`}
            title="Save note (Ctrl+S)"
          >
            {saveStatus === 'saving' ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'synced' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className={`w-3.5 h-3.5 ${hasUnsavedChanges ? 'text-white' : 'text-slate-400'}`} />
                <span>{hasUnsavedChanges ? 'Save Note' : 'Saved'}</span>
                {hasUnsavedChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                )}
              </>
            )}
          </button>

          {/* Folder Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 sm:px-2.5 py-1 rounded-xl border border-white/5 text-[11px] sm:text-xs text-slate-300 max-w-[130px] sm:max-w-none">
            <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={folderId || ''}
              onChange={(e) => handleFolderChange(e.target.value || null)}
              className="bg-transparent border-none outline-none text-slate-200 cursor-pointer truncate text-[11px] sm:text-xs"
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

        {/* Right: AI Model Selector, AI Triggers & View Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Dynamic AI Model Selector */}
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] sm:text-xs font-semibold shadow-sm transition-all"
            title="Generate AI summary"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-indigo-400'}`} />
            <span className="hidden sm:inline">{isSummarizing ? 'Summarizing...' : 'AI Summary'}</span>
            <span className="sm:hidden">{isSummarizing ? '...' : 'Summary'}</span>
          </button>

          <button
            onClick={handleSuggestTags}
            disabled={isSuggestingTags}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] sm:text-xs font-semibold shadow-sm transition-all"
            title="Suggest tags with LLM"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{isSuggestingTags ? 'Extracting...' : 'Auto Tag'}</span>
            <span className="sm:hidden">{isSuggestingTags ? '...' : 'Tags'}</span>
          </button>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Edit Mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:block px-2 py-1 rounded-lg text-xs transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview Mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
            title="Delete Note"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Note Title & Tags Bar */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Note..."
          className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl md:text-3xl font-extrabold text-white placeholder-slate-600 tracking-tight"
        />

        {/* Tags input & chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-[11px] sm:text-xs text-indigo-300 font-medium group"
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
          <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-400">
            <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag (Enter)..."
              className="bg-transparent border-none outline-none text-slate-300 placeholder-slate-600 w-28 sm:w-36 text-xs"
            />
          </div>
        </div>

        {/* AI Summary Highlight Panel */}
        {summary && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 backdrop-blur-md relative group animate-in fade-in">
            <div className="flex items-center justify-between font-semibold text-indigo-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> AI Executive Summary
              </span>
              <button
                onClick={() => {
                  setSummary(null);
                  setHasUnsavedChanges(true);
                }}
                className="text-slate-400 hover:text-white transition-colors"
                title="Dismiss summary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="leading-relaxed whitespace-pre-line text-slate-300 text-[11px] sm:text-xs">{summary}</p>
          </div>
        )}
      </div>

      {/* Editor & Preview Responsive Split/Tabbed Pane */}
      <div className="flex-1 flex overflow-hidden px-4 sm:px-8 pb-4 sm:pb-6 pt-2 gap-4 lg:gap-6">
        {/* Editor TextArea */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className={`flex-1 flex flex-col h-full ${viewMode === 'split' ? 'lg:w-1/2' : 'w-full'}`}>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Write your thoughts in Markdown (e.g. # Architecture, - Points, `code`)..."
              className="w-full h-full bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 focus:border-indigo-500/50 outline-none text-slate-200 placeholder-slate-600 font-mono text-xs sm:text-sm leading-relaxed resize-none transition-all shadow-inner"
            />
          </div>
        )}

        {/* Markdown Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`flex-1 flex flex-col h-full bg-slate-950/20 p-4 sm:p-6 rounded-2xl border border-white/5 overflow-y-auto ${
              viewMode === 'split' ? 'lg:w-1/2' : 'w-full'
            }`}
          >
            <div className="markdown-body text-xs sm:text-sm">
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
