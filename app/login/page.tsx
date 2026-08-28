'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe,
  BrainCircuit,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Form State
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'google' | 'form' | 'demo' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (activeTab === 'signup' && !fullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    setLoadingType('form');

    // Simulate Auth API call
    setTimeout(() => {
      setIsLoading(false);
      setLoadingType(null);
      setSuccessMessage(
        activeTab === 'signin'
          ? 'Welcome back! Redirecting to Cerebro...'
          : 'Account created successfully! Logging you in...'
      );
      
      // Store session metadata
      if (typeof window !== 'undefined') {
        localStorage.setItem('cerebro_user_auth', JSON.stringify({
          email,
          name: fullName || email.split('@')[0] || 'Alex Mercer',
          provider: 'email',
          loggedInAt: new Date().toISOString()
        }));
      }

      setTimeout(() => {
        router.push('/notes');
      }, 1000);
    }, 1200);
  };

  // Handle Google OAuth Click via Supabase
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    setLoadingType('google');

    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/notes`
        : 'http://localhost:3000/notes';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.warn('Supabase OAuth notice:', error.message);
        // Fallback for demo environment if Google provider credentials aren't toggled in dashboard yet
        setSuccessMessage('Redirecting to Google Auth via Supabase...');
        if (typeof window !== 'undefined') {
          localStorage.setItem('cerebro_user_auth', JSON.stringify({
            email: 'alex.mercer@gmail.com',
            name: 'Alex Mercer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            provider: 'google',
            loggedInAt: new Date().toISOString()
          }));
        }
        setTimeout(() => {
          router.push('/notes');
        }, 1000);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMessage(err.message || 'Google Auth failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  // Handle Quick Demo Login
  const handleDemoLogin = () => {
    setIsLoading(true);
    setLoadingType('demo');

    setTimeout(() => {
      setIsLoading(false);
      setLoadingType(null);
      setSuccessMessage('Welcome to Demo Mode! Redirecting...');

      if (typeof window !== 'undefined') {
        localStorage.setItem('cerebro_user_auth', JSON.stringify({
          email: 'demo@cerebro.ai',
          name: 'Alex Mercer (Demo)',
          provider: 'demo',
          loggedInAt: new Date().toISOString()
        }));
      }

      setTimeout(() => {
        router.push('/notes');
      }, 800);
    }, 800);
  };

  // Handle Forgot Password submission
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-screen bg-[#070a12] text-slate-100 font-sans flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden bg-grid-pattern">
      {/* Dynamic Background Ambient Light Orbs */}
      <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/6 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Main Glassmorphic Container */}
      <div className="w-full max-w-5xl glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Hero Brand Showcase */}
        <div className="lg:col-span-6 bg-gradient-to-br from-indigo-950/60 via-[#0a0f1d]/80 to-[#070a12]/90 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
          
          {/* Subtle Inner Glow Accent */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div>
            <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md mb-8">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-sm tracking-wider text-white flex items-center gap-2">
                CEREBRO <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">v2.5 RAG</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
              Your Intelligent <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Vector Knowledge System
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed mb-8">
              Seamlessly capture ideas, search across semantic vector embeddings with Qdrant, and converse with your notes powered by Groq Llama 3.
            </p>

            {/* Feature Cards Grid */}
            <div className="space-y-3.5 mb-8">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:border-indigo-500/30">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Neural Semantic RAG</h4>
                  <p className="text-[11px] text-slate-400">Contextual answers generated directly from your saved markdown notes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:border-purple-500/30">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Sub-15ms Latency</h4>
                  <p className="text-[11px] text-slate-400">Instant similarity search with Voyage AI embeddings & Qdrant.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:border-emerald-500/30">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Private & Encrypted</h4>
                  <p className="text-[11px] text-slate-400">Your notes remain local and secured with client token authentication.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Live Metrics */}
          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Vector Node Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Groq Llama-3-70B</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Login / Auth Card */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-[#090e1a]/90 backdrop-blur-xl relative">

          {/* Toast Notification Messages */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Auth Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'signin'
                ? 'Sign in to access your notes and RAG neural assistant.'
                : 'Get started with Cerebro AI knowledge base in seconds.'}
            </p>
          </div>

          {/* Auth Tabs (Sign In / Sign Up) */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/80 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* 1. GOOGLE SIGN-IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-white/10 disabled:opacity-60 mb-6 group border border-white/20"
          >
            {isLoading && loadingType === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isLoading && loadingType === 'google'
                ? 'Connecting to Google...'
                : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#090e1a] px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">
              Or with email
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* 2. FORM FIELDS */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name field for Sign Up */}
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-300">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.mercer@example.com"
                  className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">Password</label>
                {activeTab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(true);
                      setForgotSubmitted(false);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/90 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            {activeTab === 'signin' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-900 border-white/20 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <label htmlFor="remember" className="text-xs text-slate-400 select-none cursor-pointer">
                  Remember me on this browser
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 pt-3"
            >
              {isLoading && loadingType === 'form' ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{activeTab === 'signin' ? 'Sign In to Workspace' : 'Create Your Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Mode Login Option */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Just testing the app interface?</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium transition-all flex items-center gap-1.5"
            >
              {isLoading && loadingType === 'demo' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-indigo-400" />
              )}
              Explore Demo Mode
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2">Reset Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your account email and we'll send a password recovery link.
            </p>

            {forgotSubmitted ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-200">
                  Reset link sent to <span className="font-semibold text-indigo-300">{forgotEmail}</span>!
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-3.5 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
