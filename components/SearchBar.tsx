'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, SlidersHorizontal, Tag, Folder as FolderIcon, X, Zap } from 'lucide-react';
import { authFetch } from '@/lib/api-client';

interface SearchBarProps {
  onSearchResults: (results: any[], isSearching: boolean, queryInfo: { text: string; mode: string }) => void;
  folders: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  selectedFolderId: string | null;
  selectedTag: string | null;
}

export default function SearchBar({
  onSearchResults,
  folders,
  tags,
  selectedFolderId,
  selectedTag,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'semantic' | 'keyword' | 'hybrid'>('semantic');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string | null>(selectedFolderId);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>(selectedTag ? [selectedTag] : []);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [methodUsed, setMethodUsed] = useState<string>('POST');

  useEffect(() => {
    setActiveFolderFilter(selectedFolderId);
  }, [selectedFolderId]);

  useEffect(() => {
    if (selectedTag && !activeTagFilters.includes(selectedTag)) {
      setActiveTagFilters([selectedTag]);
    }
  }, [selectedTag]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 280);

    return () => clearTimeout(timer);
  }, [query, mode, activeFolderFilter, activeTagFilters]);

  const executeSearch = async () => {
    if (!query.trim() && activeTagFilters.length === 0 && !activeFolderFilter) {
      onSearchResults([], false, { text: '', mode });
      return;
    }

    setIsLoading(true);
    const payload = {
      text: query,
      filters: {
        tags: activeTagFilters,
        folderId: activeFolderFilter,
      },
      mode,
      limit: 20,
    };

    try {
      let response: Response;
      try {
        response = await authFetch('/api/notes/search', {
          method: 'QUERY',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setMethodUsed('QUERY');
      } catch (queryErr) {
        response = await authFetch('/api/notes/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setMethodUsed('POST (fallback)');
      }

      if (!response.ok && response.status === 405) {
        response = await authFetch('/api/notes/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setMethodUsed('POST (fallback)');
      }

      if (response.ok) {
        const data = await response.json();
        onSearchResults(data.results || [], false, { text: query, mode });
      }
    } catch (err) {
      console.error('Search request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    setActiveTagFilters((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  return (
    <div className="w-full relative z-20">
      <div className="glass-panel rounded-2xl p-2 sm:p-2.5 transition-all shadow-xl shadow-indigo-950/20 border border-white/10 hover:border-indigo-500/40">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="pl-1 sm:pl-2 text-indigo-400 shrink-0">
            {isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'semantic' ? (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 animate-pulse" />
            ) : (
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'semantic'
                ? 'Search by meaning / concept...'
                : mode === 'hybrid'
                ? 'Hybrid vector + keyword search...'
                : 'Search notes by keyword...'
            }
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-400 text-xs sm:text-sm py-1 min-w-0"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mode Switcher Tabs for Desktop */}
          <div className="hidden md:flex items-center bg-slate-900/80 p-0.5 sm:p-1 rounded-xl border border-white/5 text-xs font-medium shrink-0">
            <button
              onClick={() => setMode('semantic')}
              className={`px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'semantic'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Semantic
            </button>
            <button
              onClick={() => setMode('hybrid')}
              className={`px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'hybrid'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Hybrid
            </button>
            <button
              onClick={() => setMode('keyword')}
              className={`px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'keyword'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Keyword
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all shrink-0 ${
              showFilters || activeTagFilters.length > 0 || activeFolderFilter
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                : 'text-slate-400 hover:text-slate-200 border-white/5 bg-slate-900/50'
            }`}
            title="Filter by Tags / Folders"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex flex-col gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
            {/* Mobile Mode Switcher */}
            <div className="md:hidden flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs font-medium w-full justify-between">
              <button
                onClick={() => setMode('semantic')}
                className={`flex-1 py-1 rounded-lg text-center text-[11px] transition-all ${
                  mode === 'semantic' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Semantic
              </button>
              <button
                onClick={() => setMode('hybrid')}
                className={`flex-1 py-1 rounded-lg text-center text-[11px] transition-all ${
                  mode === 'hybrid' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Hybrid
              </button>
              <button
                onClick={() => setMode('keyword')}
                className={`flex-1 py-1 rounded-lg text-center text-[11px] transition-all ${
                  mode === 'keyword' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Keyword
              </button>
            </div>

            {/* Folder Filters */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                <FolderIcon className="w-3.5 h-3.5" /> Folder:
              </span>
              <button
                onClick={() => setActiveFolderFilter(null)}
                className={`px-2 py-0.5 rounded-lg border text-[11px] sm:text-xs ${
                  activeFolderFilter === null
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold'
                    : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderFilter(f.id === activeFolderFilter ? null : f.id)}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] sm:text-xs truncate max-w-[120px] ${
                    activeFolderFilter === f.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.name)}
                  className={`px-2 py-0.5 rounded-full border text-[11px] sm:text-xs transition-all ${
                    activeTagFilters.includes(t.name)
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  #{t.name}
                </button>
              ))}
              {activeTagFilters.length > 0 && (
                <button
                  onClick={() => setActiveTagFilters([])}
                  className="text-[11px] text-rose-400 hover:underline ml-1"
                >
                  Clear tags
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
