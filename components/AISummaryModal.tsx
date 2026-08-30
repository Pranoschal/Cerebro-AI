'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AISummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  noteTitle: string;
  onClear: () => void;
}

export default function AISummaryModal({
  open,
  onOpenChange,
  summary,
  noteTitle,
  onClear,
}: AISummaryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            AI Executive Summary
          </DialogTitle>
          <DialogDescription>
            {noteTitle ? `Summary for "${noteTitle}"` : 'AI-generated summary of your note'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/50 min-h-0 max-h-[50vh] sm:max-h-[55vh]">
          <div className="markdown-body text-xs sm:text-sm">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>

        <DialogFooter className="pt-1">
          <button
            type="button"
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Remove Summary
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-600/20"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
