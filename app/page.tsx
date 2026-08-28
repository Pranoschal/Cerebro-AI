'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Zap,
  ShieldCheck,
  Search,
  Bot,
  Database,
  Tag,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  FileText,
  Terminal,
  Globe,
  Star,
  Users,
  Code2,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'rag' | 'search' | 'tagging'>('rag');

  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden selection:bg-indigo-500 selection:text-white bg-grid-pattern transition-colors duration-200">
      {/* Dynamic Background Ambient Light Orbs */}
      <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
      <div className="absolute top-1/3 right-1/4 w-[35rem] h-[35rem] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-float-reverse" />
      <div className="absolute bottom-1/4 left-1/3 w-[30rem] h-[30rem] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#070a12]/80 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              CEREBRO <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-500/30">AI</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Features</a>
            <a href="#rag-engine" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">RAG Engine</a>
            <a href="#tech-stack" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Architecture</a>
            <a href="#comparison" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Why Cerebro</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/notes"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Next-Gen RAG Vector Knowledge Base</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-indigo-600 dark:text-indigo-400 font-mono">v2.5 Release</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Turn Your Notes Into An{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Intelligent Neural Brain
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
          Seamlessly store markdown notes, search semantic vector embeddings with Qdrant and Voyage AI, and converse directly with your notes using Groq Llama 3 inference.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/notes"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2.5 backdrop-blur-md"
          >
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Open Workspace</span>
          </Link>
        </div>

        {/* Live Metrics Strip */}
        <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-3 px-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 backdrop-blur-md text-xs text-slate-600 dark:text-slate-400 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Vector DB: <strong className="text-slate-900 dark:text-slate-200 font-mono">Qdrant Active</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Search Latency: <strong className="text-slate-900 dark:text-slate-200 font-mono">&lt;15ms</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>LLM Model: <strong className="text-slate-900 dark:text-slate-200 font-mono">Groq Llama 3</strong></span>
          </div>
        </div>

        {/* 3. INTERACTIVE PRODUCT PREVIEW MOCKUP */}
        <div className="mt-16 relative max-w-6xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-20 dark:opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          
          <div className="relative rounded-3xl border border-slate-200 dark:border-white/15 overflow-hidden shadow-2xl bg-white dark:bg-[#090e1a]/90 backdrop-blur-2xl">
            {/* Browser Header Bar */}
            <div className="px-4 py-3 bg-slate-100 dark:bg-[#070a12] border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-mono text-slate-500">cerebro-app.internal/notes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono border border-purple-200 dark:border-purple-500/30 font-medium">
                  RAG Drawer Open
                </span>
              </div>
            </div>

            {/* Mockup Workspace Interface */}
            <div className="grid grid-cols-12 min-h-[420px] text-left">
              
              {/* Left Sidebar Mock */}
              <div className="col-span-3 bg-slate-50 dark:bg-[#090d16] border-r border-slate-200 dark:border-white/10 p-4 hidden sm:flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">CEREBRO</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-between border border-indigo-200 dark:border-indigo-500/30">
                      <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> All Notes</span>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">12</span>
                    </div>
                    <div className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-xl flex items-center justify-between">
                      <span className="flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Ask RAG AI</span>
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 flex items-center gap-2 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">U</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">Your Account</p>
                    <p className="text-[9px] text-slate-500 truncate">Sign in to get started</p>
                  </div>
                </div>
              </div>

              {/* Note Editor Main Area Mock */}
              <div className="col-span-12 sm:col-span-5 p-6 bg-white dark:bg-[#070a12] border-r border-slate-200 dark:border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mb-2">
                    <span>#architecture</span>
                    <span>#vector-rag</span>
                    <span>#embeddings</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                    Neural RAG Architecture & Vector Indexing
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    When notes are created, Voyage AI calculates 1024-dimensional dense vectors stored directly in Qdrant. Groq Llama 3 queries these chunks for semantic grounding...
                  </p>

                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-[11px] font-mono text-indigo-700 dark:text-indigo-300 space-y-1">
                    <p className="text-slate-500">// Qdrant Payload Query</p>
                    <p>qdrantClient.search("notes", &#123; vector, top: 3 &#125;);</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Synced to Qdrant</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-saved
                  </span>
                </div>
              </div>

              {/* RAG Drawer Right Mock */}
              <div className="col-span-12 sm:col-span-4 p-5 bg-purple-50/50 dark:bg-gradient-to-b dark:from-purple-950/20 dark:to-[#090d16] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">Neural RAG Assistant</span>
                    </div>
                    <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Groq Llama 3</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-sm">
                      <p className="text-[10px] text-slate-500 mb-1">User Query</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">"How does vector similarity search work in Cerebro?"</p>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-100/70 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/30 text-purple-950 dark:text-purple-100 space-y-2">
                      <p className="text-[11px] leading-relaxed">
                        Cerebro extracts content chunks, calculates Voyage AI dense embeddings, and performs cosine distance matching in Qdrant before constructing Groq's prompt.
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-purple-700 dark:text-purple-300 font-mono">
                        <span>Citations:</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-500/30 border border-purple-300 dark:border-purple-400/30 font-medium">#architecture</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                  <span>100% Grounded in your notes</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-pulse" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE SHOWCASE GRID */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Engineered For Speed & Intelligence
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Everything you need to organize ideas, search instantly across thousands of notes, and synthesize answers with state-of-the-art AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Feature 1 */}
          <div className="rounded-2xl p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Vector RAG Search</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sub-15ms semantic matching using Qdrant vector database and Voyage AI embeddings.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-purple-400 dark:hover:border-purple-500/40 transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Groq Llama 3 Inference</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ultra-fast AI reasoning over your private knowledge base with clear source citations.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Auto AI Tagging</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant AI taxonomy generation suggesting relevant tags as you type notes.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl p-6 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-amber-400 dark:hover:border-amber-500/40 transition-all hover:-translate-y-1 group shadow-sm hover:shadow-md dark:shadow-none">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Markdown Studio</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Full GitHub Flavored Markdown support with split live preview & syntax highlighting.
            </p>
          </div>

        </div>
      </section>

      {/* 5. COMPARISON SECTION */}
      <section id="comparison" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Traditional Notes vs. Cerebro Vector RAG
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Stop losing valuable ideas in static folder hierarchies. Experience true semantic recall.
          </p>
        </div>

        <div className="max-w-4xl mx-auto rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl bg-white dark:bg-[#090e1a]">
          <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-900/90 p-4 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="col-span-5 sm:col-span-4">Capability</div>
            <div className="col-span-3 sm:col-span-4 text-slate-500">Traditional App</div>
            <div className="col-span-4 text-indigo-600 dark:text-indigo-400 font-semibold">Cerebro AI RAG</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/5 text-xs">
            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-4 font-semibold text-slate-800 dark:text-slate-200">Search Paradigm</div>
              <div className="col-span-3 sm:col-span-4 text-slate-500">Exact Keyword Match</div>
              <div className="col-span-4 text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>3D Vector Semantic Similarity</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-4 font-semibold text-slate-800 dark:text-slate-200">Knowledge Recall</div>
              <div className="col-span-3 sm:col-span-4 text-slate-500">Manual File Browsing</div>
              <div className="col-span-4 text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Conversational RAG AI Assistant</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-4 font-semibold text-slate-800 dark:text-slate-200">Tagging & Taxonomy</div>
              <div className="col-span-3 sm:col-span-4 text-slate-500">100% Manual Typing</div>
              <div className="col-span-4 text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>AI Suggested Tagging</span>
              </div>
            </div>

            <div className="grid grid-cols-12 p-4 items-center">
              <div className="col-span-5 sm:col-span-4 font-semibold text-slate-800 dark:text-slate-200">Response Speed</div>
              <div className="col-span-3 sm:col-span-4 text-slate-500">Slow Database Scans</div>
              <div className="col-span-4 text-indigo-600 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>&lt;15ms Qdrant Lookup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-10 md:p-16 border border-indigo-200 dark:border-indigo-500/30 text-center relative overflow-hidden bg-gradient-to-r from-indigo-50 via-white to-purple-50 dark:from-indigo-950/80 dark:via-[#0a0f1d] dark:to-purple-950/80 shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 relative z-10">
            Ready to Supercharge Your Thought Flow?
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 relative z-10">
            Join thousands of developers, researchers, and creators using Cerebro AI to build their personal vector knowledge graph.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/notes"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-md transition-all"
            >
              Explore Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-12 bg-slate-100 dark:bg-[#05080e] text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">CEREBRO AI</span>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span>Next-Gen RAG Vector Knowledge Base</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/notes" className="hover:text-indigo-600 dark:hover:text-slate-300 transition-colors">Workspace</Link>
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-slate-300 transition-colors">Features</a>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[11px]">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
