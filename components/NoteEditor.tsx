'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Tag,
  Folder,
  Trash2,
  Eye,
  Edit3,
  Check,
  RotateCw,
  Plus,
  X,
  Send,
  Lightbulb,
  FileEdit,
  Wand2,
  ChevronDown,
  ArrowLeft,
  Save,
} from 'lucide-react';
import ModelSelector from '@/components/ModelSelector';
import { authFetch } from '@/lib/api-client';

interface NoteEditorProps {
  note: {
    id: string;
    title: string;
    content: string;
    summary?: string | null;
    tags?: Array<{ id: string; name: string }>;
    folder?: { id: string; name: string } | null;
    folderId?: string | null;
  } | null;
  folders: Array<{ id: string; name: string }>;
  availableTags: Array<{ id: string; name: string }>;
  onUpdateNote: (updatedNote: any) => void;
  onDeleteNote: (id: string) => void;
  onBack?: () => void;
  isNotesListCollapsed?: boolean;
  onToggleNotesListCollapse?: () => void;
}

export default function NoteEditor({
  note,
  folders,
  availableTags,
  onUpdateNote,
  onDeleteNote,
  onBack,
  isNotesListCollapsed,
  onToggleNotesListCollapse,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'unsaved'>('synced');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.3-70b-versatile');

  // AI Writing Copilot state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotGenerating, setIsCopilotGenerating] = useState(false);
  const [customCopilotPrompt, setCustomCopilotPrompt] = useState('');
  const [copilotStatusMsg, setCopilotStatusMsg] = useState<string | null>(null);
  const copilotDropdownRef = useRef<HTMLDivElement>(null);

  // Sync state when incoming note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setSummary(note.summary || null);
      setTags(note.tags?.map((t) => t.name) || []);
      setFolderId(note.folderId || (note.folder ? note.folder.id : null));
      setSaveStatus('synced');
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      setSummary(null);
      setTags([]);
      setFolderId(null);
      setSaveStatus('synced');
      setHasUnsavedChanges(false);
    }
  }, [note?.id]);

  // Close AI copilot dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (copilotDropdownRef.current && !copilotDropdownRef.current.contains(event.target as Node)) {
        setIsCopilotOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts: Ctrl+S to save, Ctrl+J for AI assist, Ctrl+\ for collapse
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        if (onToggleNotesListCollapse) {
          onToggleNotesListCollapse();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note?.id, title, content, summary, tags, folderId, hasUnsavedChanges, onToggleNotesListCollapse]);

  // Mark changes when typing
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleFolderChange = (val: string | null) => {
    setFolderId(val);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  // EXPLICIT SAVE FUNCTION
  const handleSaveNote = async () => {
    if (!note) return;
    setSaveStatus('saving');

    try {
      const response = await authFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          summary,
          tags,
          folderId,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        onUpdateNote(updated);
        setSaveStatus('synced');
        setHasUnsavedChanges(false);
      } else {
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      setSaveStatus('unsaved');
    }
  };

  // AI Copilot Action Generator
  const handleAICopilotAction = async (action: 'continue' | 'outline' | 'polish' | 'custom', customPrompt?: string) => {
    if (!note) return;
    setIsCopilotGenerating(true);
    setIsCopilotOpen(false);
    setCopilotStatusMsg(
      action === 'continue'
        ? 'Writing continuation...'
        : action === 'outline'
        ? 'Drafting outline...'
        : action === 'polish'
        ? 'Polishing prose...'
        : 'Generating AI assist...'
    );

    try {
      const response = await authFetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          prompt: customPrompt,
          currentContent: content,
          title,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          let nextContent = content;
          if (action === 'polish' || action === 'custom') {
            nextContent = data.result;
          } else {
            nextContent = content.trim() ? `${content.trim()}\n\n${data.result}` : data.result;
          }
          setContent(nextContent);
          setHasUnsavedChanges(true);
          setSaveStatus('unsaved');
          setCopilotStatusMsg('Content inserted! Click Save Note.');
          setTimeout(() => setCopilotStatusMsg(null), 3500);
        }
      } else {
        const err = await response.json();
        setCopilotStatusMsg(`AI Error: ${err.error || 'Request failed'}`);
        setTimeout(() => setCopilotStatusMsg(null), 4000);
      }
    } catch (e: any) {
      setCopilotStatusMsg(`AI Error: ${e.message}`);
      setTimeout(() => setCopilotStatusMsg(null), 4000);
    } finally {
      setIsCopilotGenerating(false);
    }
  };

  // AI Summarization
  const handleSummarize = async () => {
    if (!content.trim() || !note) return;
    setIsSummarizing(true);
    try {
      const response = await authFetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title, model: selectedModel }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error('Failed to summarize note:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Tag Suggestions
  const handleSuggestTags = async () => {
    if (!content.trim() || !note) return;
    setIsSuggestingTags(true);
    try {
      const response = await authFetch('/api/ai/tag-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title,
          existingTags: availableTags.map((t) => t.name),
          model: selectedModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggested: string[] = data.suggestedTags || [];
        const merged = Array.from(new Set([...tags, ...suggested]));
        setTags(merged);
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
      }
    } catch (err) {
      console.error('Failed to suggest tags:', err);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  // Tag Management
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const normalized = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(normalized)) {
        const updated = [...tags, normalized];
        setTags(updated);
        setHasUnsavedChanges(true);
        setSaveStatus('unsaved');
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    const updated = tags.filter((t) => t !== tagName);
    setTags(updated);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center select-none bg-slate-50 dark:bg-[#090d16]/80">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </button>
        )}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-slate-200/80 dark:bg-slate-900/60 border border-slate-300 dark:border-white/5 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-sm">
          <Edit3 className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-300">Select or Create a Note</h2>
        <p className="text-xs md:text-sm text-slate-500 max-w-sm mt-1 px-4">
          Choose a note from the list or create a fresh workspace to start capturing thoughts and querying with AI.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md">
      {/* Top Header & AI Toolbar */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 glass-panel bg-white/90 dark:bg-[#0b0f19]/80 relative z-30">
        {/* Left: Mobile Back & Save Action / Status */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden flex items-center gap-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/10"
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
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
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
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className={`w-3.5 h-3.5 ${hasUnsavedChanges ? 'text-white' : 'text-slate-400'}`} />
                <span>{hasUnsavedChanges ? 'Save Note' : 'Saved'}</span>
                {hasUnsavedChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </>
            )}
          </button>

          {/* Folder Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-2 sm:px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 max-w-[130px] sm:max-w-none">
            <Folder className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <select
              value={folderId || ''}
              onChange={(e) => handleFolderChange(e.target.value || null)}
              className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 cursor-pointer truncate text-[11px] sm:text-xs"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-500">
                No Folder
              </option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: AI Model Selector, AI Assist, AI Triggers & View Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Dynamic AI Model Selector */}
          <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} align="left" />

          {/* AI WRITING COPILOT DROPDOWN */}
          <div className="relative" ref={copilotDropdownRef}>
            <button
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              disabled={isCopilotGenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
                isCopilotGenerating
                  ? 'bg-purple-100 dark:bg-purple-950/80 border-purple-400 dark:border-purple-500 text-purple-800 dark:text-purple-200 animate-pulse'
                  : 'bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
              }`}
              title="AI Writing Assistant (Ctrl+J)"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isCopilotGenerating ? 'animate-spin text-purple-600 dark:text-purple-300' : 'text-purple-600 dark:text-purple-400'}`} />
              <span className="hidden sm:inline">{isCopilotGenerating ? 'Writing...' : 'AI Assist'}</span>
              <ChevronDown className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            </button>

            {isCopilotOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/20 shadow-2xl p-2.5 z-[100] animate-in fade-in slide-in-from-top-1 text-xs">
                <div className="px-1 py-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" /> In-Note AI Copilot
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500">Ctrl+J to write</span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleAICopilotAction('continue')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-purple-300 dark:hover:border-purple-500/30 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all group"
                  >
                    <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                        Continue Writing
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Expand note from current point
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAICopilotAction('outline')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-amber-300 dark:hover:border-purple-500/30 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all group"
                  >
                    <div className="p-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-300">
                        Brainstorm Outline
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Add structured bullet outline & key ideas
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleAICopilotAction('polish')}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-emerald-300 dark:hover:border-purple-500/30 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all group"
                  >
                    <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FileEdit className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                        Polish & Fix Grammar
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Improve clarity, flow & technical phrasing
                      </div>
                    </div>
                  </button>
                </div>

                {/* Custom Instruction Box */}
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Custom AI prompt:</div>
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl p-2 border border-slate-200 dark:border-white/10 focus-within:border-purple-500/60 transition-all">
                    <textarea
                      rows={3}
                      value={customCopilotPrompt}
                      onChange={(e) => setCustomCopilotPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && customCopilotPrompt.trim()) {
                          e.preventDefault();
                          handleAICopilotAction('custom', customCopilotPrompt);
                        }
                      }}
                      placeholder="e.g. Write me a note on RAG and RAG Systems..."
                      className="bg-transparent border-none outline-none text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">
                        Enter to send (Shift+Enter for newline)
                      </span>
                      <button
                        onClick={() => handleAICopilotAction('custom', customCopilotPrompt)}
                        disabled={!customCopilotPrompt.trim()}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 shrink-0 text-[10px] font-semibold flex items-center gap-1 transition-all"
                      >
                        <span>Generate</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-[11px] sm:text-xs font-semibold shadow-sm transition-all"
            title="Generate AI summary"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-indigo-600 dark:text-indigo-400'}`} />
            <span className="hidden sm:inline">{isSummarizing ? 'Summarizing...' : 'AI Summary'}</span>
            <span className="sm:hidden">{isSummarizing ? '...' : 'Summary'}</span>
          </button>

          <button
            onClick={handleSuggestTags}
            disabled={isSuggestingTags}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-[11px] sm:text-xs font-semibold shadow-sm transition-all"
            title="Suggest tags with LLM"
          >
            <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">{isSuggestingTags ? 'Extracting...' : 'Auto Tag'}</span>
            <span className="sm:hidden">{isSuggestingTags ? '...' : 'Tags'}</span>
          </button>

          {/* View Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-xl border border-slate-200 dark:border-white/5 text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Edit Mode"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:block px-2 py-1 rounded-lg text-xs transition-colors ${
                viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Preview Mode"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
            title="Delete Note"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Floating Copilot Status Pill */}
      {copilotStatusMsg && (
        <div className="px-4 sm:px-8 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-200 text-xs font-mono animate-in fade-in slide-in-from-top-1 shadow-md">
            {isCopilotGenerating ? (
              <RotateCw className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
            ) : (
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            )}
            <span>{copilotStatusMsg}</span>
          </div>
        </div>
      )}

      {/* Note Title & Tags Bar */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Note..."
          className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 tracking-tight"
        />

        {/* Tags input & chips */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-[11px] sm:text-xs text-indigo-700 dark:text-indigo-300 font-medium group"
            >
              #{t}
              <button
                onClick={() => handleRemoveTag(t)}
                className="text-indigo-500 dark:text-indigo-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag (Enter)..."
              className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 w-28 sm:w-36 text-xs"
            />
          </div>
        </div>

        {/* AI Summary Highlight Panel */}
        {summary && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200 backdrop-blur-md relative group animate-in fade-in">
            <div className="flex items-center justify-between font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> AI Executive Summary
              </span>
              <button
                onClick={() => {
                  setSummary(null);
                  setHasUnsavedChanges(true);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                title="Dismiss summary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">{summary}</p>
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
              placeholder="Write your thoughts in Markdown (e.g. # Architecture, - Points, `code`)... Or click 'AI Assist' / press Ctrl+J to write with AI!"
              className="w-full h-full bg-slate-50/80 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/5 focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 font-mono text-xs sm:text-sm leading-relaxed resize-none transition-all shadow-inner"
            />
          </div>
        )}

        {/* Markdown Live Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-950/20 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/5 overflow-y-auto shadow-sm dark:shadow-none ${
              viewMode === 'split' ? 'lg:w-1/2' : 'w-full'
            }`}
          >
            <div className="markdown-body text-xs sm:text-sm">
              {content.trim() ? (
                <ReactMarkdown>{content}</ReactMarkdown>
              ) : (
                <p className="text-slate-400 italic">Preview will appear here...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
