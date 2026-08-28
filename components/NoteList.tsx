'use client';

import React from 'react';
import { Pin, Archive, Sparkles, Folder, Tag, Clock, ChevronRight } from 'lucide-react';

interface NoteItem {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  folder?: { id: string; name: string } | null;
  tags?: Array<{ id: string; name: string }>;
  relevanceScore?: number;
}

interface NoteListProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (note: NoteItem) => void;
  onTogglePin: (note: NoteItem, e: React.MouseEvent) => void;
  onToggleArchive: (note: NoteItem, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export default function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onTogglePin,
  onToggleArchive,
  isLoading,
}: NoteListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 dark:text-slate-300">No notes found</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Create a new note or adjust your search filter to uncover stored knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-3 overflow-y-auto">
      {notes.map((note) => {
        const isSelected = note.id === selectedNoteId;
        return (
          <div
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={`group relative rounded-2xl p-4 cursor-pointer transition-all border text-left ${
              isSelected
                ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-950/50'
                : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-sm hover:shadow-md dark:shadow-none'
            }`}
          >
            {/* Header: Title & Actions */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {note.title || 'Untitled Note'}
              </h3>
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {note.relevanceScore !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono font-medium border border-indigo-200 dark:border-indigo-500/30">
                    Match {Math.round(note.relevanceScore * 100)}%
                  </span>
                )}
                <button
                  onClick={(e) => onTogglePin(note, e)}
                  title={note.isPinned ? 'Unpin note' : 'Pin note'}
                  className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${
                    note.isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={(e) => onToggleArchive(note, e)}
                  title={note.isArchived ? 'Restore note' : 'Archive note'}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content snippet */}
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
              {note.content ? note.content.replace(/[#*`_]/g, '') : 'Empty content...'}
            </p>

            {/* AI Summary Badge if exists */}
            {note.summary && (
              <div className="mt-2.5 flex items-start gap-1.5 p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-[11px] text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="line-clamp-2">{note.summary.replace(/### Summary|\*/g, '').trim()}</p>
              </div>
            )}

            {/* Footer: Folder, Tags, Timestamp */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex flex-wrap items-center gap-1.5">
                {note.folder && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-medium">
                    <Folder className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    {note.folder.name}
                  </span>
                )}
                {note.tags?.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-white/5 text-indigo-700 dark:text-indigo-300 font-medium"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(note.updatedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
