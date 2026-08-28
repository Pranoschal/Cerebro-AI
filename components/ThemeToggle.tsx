'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl transition-all border ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-white/10 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 hover:border-indigo-400/40 shadow-sm shadow-slate-200'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-300 transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
      )}
      {showLabel && (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
