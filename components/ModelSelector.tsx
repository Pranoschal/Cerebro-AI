'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, ChevronDown, Check, Sparkles, Zap, Shield, HelpCircle } from 'lucide-react';
import { AIModel } from '@/app/api/ai/models/route';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
  align?: 'left' | 'right';
}

export default function ModelSelector({
  selectedModel,
  onSelectModel,
  className = '',
  align = 'left',
}: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available models from dynamic API route
  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/models');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.models)) {
            setModels(data.models);
            if (!selectedModel && data.defaultModel) {
              onSelectModel(data.defaultModel);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load AI models:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchModels();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModel = models.find((m) => m.id === selectedModel) || {
    id: selectedModel || 'llama-3.3-70b-versatile',
    name: selectedModel ? selectedModel.split('-')[0].toUpperCase() : 'Llama 3.3 (70B)',
    badge: 'Recommended',
  };

  const alignClass = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 transition-all shadow-sm group"
        title="Select Groq LLM Model"
      >
        <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold truncate max-w-[110px] sm:max-w-[140px] text-left">
          {currentModel.name}
        </span>
        {currentModel.badge && (
          <span className="hidden sm:inline-block text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-500/30 shrink-0 font-medium">
            {currentModel.badge}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${alignClass} top-full mt-2 w-72 sm:w-84 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-white/20 shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-1 text-xs`}>
          <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span>Groq Neural Engines</span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live API
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto mt-1 space-y-1">
            {models.map((model) => {
              const isSelected = model.id === selectedModel;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('cerebro_selected_model', model.id);
                    }
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-900 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">{model.name}</span>
                      {model.badge && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-500/30">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                        {model.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{model.developer || 'Groq'}</span>
                      {model.context_window && (
                        <>
                          <span>•</span>
                          <span>{(model.context_window / 1024).toFixed(0)}k ctx</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
