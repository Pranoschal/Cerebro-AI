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
      <div className="glass-panel rounded-2xl p-2.5 transition-all shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-indigo-950/20 border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/40 flex flex-col gap-2 bg-white/90 dark:bg-slate-900/80">
        {/* 1. Full-width Input Row */}
        <div className="flex items-center gap-2">
          <div className="pl-1 text-indigo-600 dark:text-indigo-400 shrink-0">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'semantic' ? (
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'semantic'
                ? 'Search notes by concept...'
                : mode === 'hybrid'
                ? 'Hybrid vector + keyword search...'
                : 'Search notes by keyword...'
            }
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm py-0.5 min-w-0"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-xl border transition-all shrink-0 ${
              showFilters || activeTagFilters.length > 0 || activeFolderFilter
                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/50 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50'
            }`}
            title="Filter by Tags / Folders"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Segmented Mode Control */}
        <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setMode('semantic')}
            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'semantic'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Semantic</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('hybrid')}
            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'hybrid'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Hybrid</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('keyword')}
            className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'keyword'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Keyword</span>
          </button>
        </div>

        {/* 3. Filter Drawer */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5 text-xs animate-in fade-in slide-in-from-top-1">
            {/* Folder Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                <FolderIcon className="w-3.5 h-3.5" /> Folder:
              </span>
              <button
                onClick={() => setActiveFolderFilter(null)}
                className={`px-2 py-0.5 rounded-lg border text-[11px] ${
                  activeFolderFilter === null
                    ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-200 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderFilter(f.id === activeFolderFilter ? null : f.id)}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] truncate max-w-[120px] ${
                    activeFolderFilter === f.id
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-300 dark:border-indigo-500 text-indigo-700 dark:text-indigo-200 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                <Tag className="w-3.5 h-3.5" /> Tags:
              </span>
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.name)}
                  className={`px-2 py-0.5 rounded-full border text-[11px] transition-all ${
                    activeTagFilters.includes(t.name)
                      ? 'bg-indigo-600 text-white border-indigo-400 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                  }`}
                >
                  #{t.name}
                </button>
              ))}
              {activeTagFilters.length > 0 && (
                <button
                  onClick={() => setActiveTagFilters([])}
                  className="text-[11px] text-rose-500 hover:underline ml-1 font-medium"
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
