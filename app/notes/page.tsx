'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  BookOpen,
  FolderPlus,
  Tag as TagIcon,
  Archive,
  Pin,
  Sparkles,
  Bot,
  Layers,
  Settings,
  Folder,
  ChevronRight,
  Database,
  Search,
  LogOut,
  User,
} from 'lucide-react';

import SearchBar from '@/components/SearchBar';
import NoteList from '@/components/NoteList';
import NoteEditor from '@/components/NoteEditor';
import AIAskPanel from '@/components/AIAskPanel';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [userAuth, setUserAuth] = useState<any>(null);
  
  // Navigation & Filter state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Search & RAG state
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isAIAskOpen, setIsAIAskOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New folder dialog
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Initial Fetch & Auth sync
  useEffect(() => {
    fetchInitialData();
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cerebro_user_auth');
      if (stored) {
        try {
          setUserAuth(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cerebro_user_auth');
    }
    router.push('/login');
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [notesRes, foldersRes, tagsRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/folders'),
        fetch('/api/tags'),
      ]);

      if (notesRes.ok) {
        const data = await notesRes.json();
        setNotes(data.notes || []);
        if (data.notes && data.notes.length > 0 && !selectedNote) {
          setSelectedNote(data.notes[0]);
        }
      }

      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Error loading notes app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new note
  const handleCreateNote = async () => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Idea & Architecture Note',
          content: '# New Project Thought\n\n- Capture ideas\n- Synthesize with RAG AI\n\n```ts\nconsole.log("Vector synced note");\n```',
          folderId: activeFolderId,
          tags: activeTag ? [activeTag] : ['draft', 'ideas'],
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        fetchInitialData(); // Refresh tags/folders counters
      }
    } catch (e) {
      console.error('Error creating note:', e);
    }
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders([...folders, folder]);
        setNewFolderName('');
        setShowNewFolderModal(false);
      }
    } catch (e) {
      console.error('Error creating folder:', e);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateLocalNote(updated);
      }
    } catch (e) {
      console.error('Error toggling pin:', e);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !note.isArchived }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes(notes.filter((n) => n.id !== note.id));
        if (selectedNote?.id === note.id) {
          setSelectedNote(notes.find((n) => n.id !== note.id) || null);
        }
      }
    } catch (e) {
      console.error('Error archiving note:', e);
    }
  };

  // Delete Note permanently
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}?permanent=true`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = notes.filter((n) => n.id !== id);
        setNotes(remaining);
        setSelectedNote(remaining[0] || null);
      }
    } catch (e) {
      console.error('Error deleting note:', e);
    }
  };

  const updateLocalNote = (updated: any) => {
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
    if (selectedNote?.id === updated.id) {
      setSelectedNote(updated);
    }
  };

  // Select note by ID (used by citations in RAG drawer)
  const handleSelectNoteById = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) {
      setSelectedNote(target);
    } else {
      // Fetch directly if not in current list
      fetch(`/api/notes/${id}`)
        .then((r) => r.json())
        .then((n) => {
          if (n && n.id) {
            setSelectedNote(n);
            setNotes((prev) => [n, ...prev]);
          }
        });
    }
  };

  // Filter notes displayed in sidebar
  const displayedNotes = (searchResults !== null ? searchResults : notes).filter((n) => {
    if (showArchived) return n.isArchived;
    if (n.isArchived) return false;
    if (activeFolderId && n.folderId !== activeFolderId) return false;
    if (activeTag && !n.tags?.some((t: any) => t.name === activeTag)) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100 font-sans">
      {/* 1. Leftmost Navigation Rail */}
      <aside className="w-64 bg-[#090d16] border-r border-white/10 flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  CEREBRO <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">AI</span>
                </h1>
                <p className="text-[10px] text-slate-500">Vector Knowledge Base</p>
              </div>
            </div>
          </div>

          {/* Action: New Note */}
          <div className="p-4">
            <button
              onClick={handleCreateNote}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Create New Note
            </button>
          </div>

          {/* Quick Views */}
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              Workspace
            </p>
            <nav className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => {
                  setActiveFolderId(null);
                  setActiveTag(null);
                  setShowArchived(false);
                  setSearchResults(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  !activeFolderId && !activeTag && !showArchived && searchResults === null
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> All Notes
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {notes.filter((n) => !n.isArchived).length}
                </span>
              </button>

              <button
                onClick={() => setIsAIAskOpen(true)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 border border-purple-500/20 bg-purple-950/20 transition-all group"
              >
                <span className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  Ask Notes (RAG)
                </span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              </button>

              <button
                onClick={() => {
                  setShowArchived(true);
                  setActiveFolderId(null);
                  setActiveTag(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  showArchived
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4" /> Archive
                </span>
              </button>
            </nav>
          </div>

          {/* Folders List */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Folders
              </p>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="text-slate-400 hover:text-indigo-400 p-0.5 rounded transition-colors"
                title="Create Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-0.5 text-xs max-h-40 overflow-y-auto">
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setActiveFolderId(f.id);
                    setActiveTag(null);
                    setShowArchived(false);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl transition-all ${
                    activeFolderId === f.id
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-indigo-400" />
                    {f.name}
                  </span>
                  <span className="text-[10px] text-slate-500">{f._count?.notes || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags List */}
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5 px-3 max-h-36 overflow-y-auto">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTag(activeTag === t.name ? null : t.name);
                    setActiveFolderId(null);
                    setShowArchived(false);
                  }}
                  className={`px-2 py-0.5 rounded-full text-[11px] border transition-all ${
                    activeTag === t.name
                      ? 'bg-indigo-600 text-white border-indigo-400 font-semibold'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile & Auth Status */}
        <div className="p-3 border-t border-white/10 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              {userAuth?.avatar ? (
                <img
                  src={userAuth.avatar}
                  alt="User Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-indigo-500/40 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {userAuth?.name ? userAuth.name.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {userAuth?.name || 'Alex Mercer'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {userAuth?.email || 'demo@notes.ai'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all shrink-0"
              title="Sign Out / Switch Account"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-slate-400 text-[10px]">Qdrant Vector DB</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-white/5">
            Groq Llama 3
          </span>
        </div>
      </aside>

      {/* 2. Middle Column: Note List + Search Bar */}
      <div className="w-96 bg-[#0a0e1a] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 bg-[#090d16]">
          <SearchBar
            folders={folders}
            tags={tags}
            selectedFolderId={activeFolderId}
            selectedTag={activeTag}
            onSearchResults={(results, isSearching, queryInfo) => {
              if (queryInfo.text || queryInfo.mode !== 'semantic') {
                setSearchResults(results);
              } else {
                setSearchResults(null);
              }
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchResults !== null && (
            <div className="px-4 py-2 bg-indigo-950/30 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
              <span>Found {searchResults.length} search matches</span>
              <button
                onClick={() => setSearchResults(null)}
                className="text-indigo-400 hover:underline text-[11px]"
              >
                Clear Search
              </button>
            </div>
          )}

          <NoteList
            notes={displayedNotes}
            selectedNoteId={selectedNote?.id || null}
            onSelectNote={(n) => setSelectedNote(n)}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 3. Right Pane: Note Editor & Split Markdown */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <NoteEditor
          note={selectedNote}
          folders={folders}
          availableTags={tags}
          onUpdateNote={updateLocalNote}
          onDeleteNote={handleDeleteNote}
        />
      </main>

      {/* 4. AI Ask RAG Side Panel Drawer */}
      <AIAskPanel
        isOpen={isAIAskOpen}
        onClose={() => setIsAIAskOpen(false)}
        onSelectNoteById={handleSelectNoteById}
        folders={folders}
        tags={tags}
      />

      {/* Modal: New Folder */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="w-full max-w-sm glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl animate-in zoom-in-95"
          >
            <h3 className="font-bold text-slate-100 text-sm mb-2 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-400" /> New Folder
            </h3>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Architecture, Roadmap, Projects"
              className="w-full bg-slate-900 px-3.5 py-2.5 rounded-xl border border-white/10 focus:border-indigo-500 outline-none text-xs text-slate-200 mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
