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
  Menu,
  X,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
} from 'lucide-react';

import SearchBar from '@/components/SearchBar';
import NoteList from '@/components/NoteList';
import NoteEditor from '@/components/NoteEditor';
import AIAskPanel from '@/components/AIAskPanel';
import { supabase } from '@/lib/supabase';
import { authFetch, getStoredUser, AuthUser } from '@/lib/api-client';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [userAuth, setUserAuth] = useState<AuthUser | null>(null);
  
  // Navigation & Filter state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  // Search & RAG state
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isAIAskOpen, setIsAIAskOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Collapse State for Distraction-Free Writing
  const [isNotesListCollapsed, setIsNotesListCollapsed] = useState(false);

  // Responsive Mobile View State
  const [activeMobileView, setActiveMobileView] = useState<'list' | 'editor'>('list');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // New folder dialog
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Initial Fetch & Auth sync with Supabase
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUserAuth(stored);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const authData: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          avatar: u.user_metadata?.avatar_url || undefined,
          provider: u.app_metadata?.provider || 'supabase',
        };
        setUserAuth(authData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cerebro_user_auth', JSON.stringify(authData));
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const authData: AuthUser = {
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'User',
          avatar: u.user_metadata?.avatar_url || undefined,
          provider: u.app_metadata?.provider || 'supabase',
        };
        setUserAuth(authData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cerebro_user_auth', JSON.stringify(authData));
        }
      }
    });

    fetchInitialData();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cerebro_user_auth');
    }
    router.push('/login');
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [notesRes, foldersRes, tagsRes] = await Promise.all([
        authFetch('/api/notes'),
        authFetch('/api/folders'),
        authFetch('/api/tags'),
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
      const res = await authFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled Note',
          content: '# New Note\n\nStart writing your thoughts here...',
          folderId: activeFolderId,
          tags: activeTag ? [activeTag] : [],
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes((prev) => [newNote, ...prev]);
        setSelectedNote(newNote);
        setActiveMobileView('editor');
        setIsMobileSidebarOpen(false);
        fetchInitialData();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create note (status ' + res.status + '):', errData);
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
      const res = await authFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setNewFolderName('');
        setShowNewFolderModal(false);
        fetchInitialData();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to create folder (status ' + res.status + '):', errData);
      }
    } catch (e) {
      console.error('Error creating folder:', e);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/notes/${note.id}`, {
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
      const res = await authFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !note.isArchived }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes(notes.filter((n) => n.id !== note.id));
        if (selectedNote?.id === note.id) {
          const next = notes.find((n) => n.id !== note.id) || null;
          setSelectedNote(next);
          if (!next) setActiveMobileView('list');
        }
      }
    } catch (e) {
      console.error('Error archiving note:', e);
    }
  };

  // Delete Note permanently
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await authFetch(`/api/notes/${id}?permanent=true`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = notes.filter((n) => n.id !== id);
        setNotes(remaining);
        const next = remaining[0] || null;
        setSelectedNote(next);
        if (!next) setActiveMobileView('list');
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

  const handleSelectNoteById = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target) {
      setSelectedNote(target);
      setActiveMobileView('editor');
    } else {
      authFetch(`/api/notes/${id}`)
        .then((r) => r.json())
        .then((n) => {
          if (n && n.id) {
            setSelectedNote(n);
            setNotes((prev) => [n, ...prev]);
            setActiveMobileView('editor');
          }
        });
    }
  };

  const handleSelectNoteFromList = (note: any) => {
    setSelectedNote(note);
    setActiveMobileView('editor');
  };

  // Filter notes displayed in sidebar
  const displayedNotes = (searchResults !== null ? searchResults : notes).filter((n) => {
    if (showArchived) return n.isArchived;
    if (n.isArchived) return false;
    if (activeFolderId && n.folderId !== activeFolderId) return false;
    if (activeTag && !n.tags?.some((t: any) => t.name === activeTag)) return false;
    return true;
  });

  // Reusable Sidebar Content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                CEREBRO <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500">Vector Knowledge Base</p>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Note */}
        <div className="p-3 sm:p-4">
          <button
            onClick={handleCreateNote}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create New Note
          </button>
        </div>

        {/* Quick Views */}
        <div className="px-3 py-1.5">
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
                setIsMobileSidebarOpen(false);
                setActiveMobileView('list');
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
              onClick={() => {
                setIsAIAskOpen(true);
                setIsMobileSidebarOpen(false);
              }}
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
                setIsMobileSidebarOpen(false);
                setActiveMobileView('list');
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
        <div className="px-3 py-1.5">
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
          <div className="flex flex-col gap-0.5 text-xs max-h-36 overflow-y-auto">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setActiveFolderId(f.id);
                  setActiveTag(null);
                  setShowArchived(false);
                  setIsMobileSidebarOpen(false);
                  setActiveMobileView('list');
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
        <div className="px-3 py-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1.5">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5 px-3 max-h-32 overflow-y-auto">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTag(activeTag === t.name ? null : t.name);
                  setActiveFolderId(null);
                  setShowArchived(false);
                  setIsMobileSidebarOpen(false);
                  setActiveMobileView('list');
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
      <div>
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
                  {userAuth?.name ? userAuth.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {userAuth?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {userAuth?.email || 'Authenticated'}
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
        <div className="p-3 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-slate-400 text-[10px]">Qdrant Vector DB</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-white/5">
            Groq Llama 3
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#070a12] text-slate-100 font-sans">
      
      {/* MOBILE TOP BAR (< 768px) */}
      <header className="md:hidden flex items-center justify-between px-3 py-2.5 bg-[#090d16] border-b border-white/10 shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-xs text-white">CEREBRO</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <button
            onClick={() => setIsAIAskOpen(true)}
            className="p-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-[11px]"
            title="Ask RAG AI"
          >
            <Bot className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER SIDEBAR DRAWER (< 768px) */}
      {isMobileSidebarOpen && (
        <>
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in"
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#090d16] border-r border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {renderSidebarContent()}
          </aside>
        </>
      )}

      {/* 1. DESKTOP PERMANENT SIDEBAR (>= 768px) */}
      <aside className="hidden md:flex w-56 lg:w-64 bg-[#090d16] border-r border-white/10 flex-col justify-between shrink-0 select-none">
        {renderSidebarContent()}
      </aside>

      {/* 2. MIDDLE COLUMN: NOTE LIST + SEARCH BAR */}
      <div
        className={`w-full md:w-80 lg:w-96 bg-[#0a0e1a] border-r border-white/10 flex-col shrink-0 transition-all duration-200 ${
          activeMobileView === 'list'
            ? 'flex flex-1 md:flex-initial h-full'
            : isNotesListCollapsed
            ? 'hidden'
            : 'hidden md:flex'
        }`}
      >
        {/* Notes Overview Panel Header with Collapse Button */}
        <div className="px-3.5 py-2 bg-[#090d16] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Notes Overview
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
              {displayedNotes.length}
            </span>
          </div>

          <button
            onClick={() => setIsNotesListCollapsed(true)}
            className="hidden md:flex items-center gap-1 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Collapse Notes Panel (Ctrl+\)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2.5 sm:p-3 border-b border-white/10 bg-[#090d16]">
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
            <div className="px-3 sm:px-4 py-2 bg-indigo-950/30 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
              <span>Found {searchResults.length} matches</span>
              <button
                onClick={() => setSearchResults(null)}
                className="text-indigo-400 hover:underline text-[11px]"
              >
                Clear
              </button>
            </div>
          )}

          <NoteList
            notes={displayedNotes}
            selectedNoteId={selectedNote?.id || null}
            onSelectNote={handleSelectNoteFromList}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 3. RIGHT PANE: NOTE EDITOR */}
      <main
        className={`flex-1 flex-col overflow-hidden relative ${
          activeMobileView === 'editor' ? 'flex h-full' : 'hidden md:flex'
        }`}
      >
        <NoteEditor
          note={selectedNote}
          folders={folders}
          availableTags={tags}
          onUpdateNote={updateLocalNote}
          onDeleteNote={handleDeleteNote}
          onBack={() => setActiveMobileView('list')}
          isNotesListCollapsed={isNotesListCollapsed}
          onToggleNotesListCollapse={() => setIsNotesListCollapsed(!isNotesListCollapsed)}
        />
      </main>

      {/* 4. AI ASK RAG SIDE PANEL DRAWER */}
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
