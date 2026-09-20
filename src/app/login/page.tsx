'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  Crown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'developer' | 'owner' | null>(null);
  const [setupIncomplete, setSetupIncomplete] = useState(false);
  const [showCredentialsBox, setShowCredentialsBox] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const setupSuccess = searchParams.get('setup') === 'success';

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (!data.setupCompleted) {
          setSetupIncomplete(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAutofill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleDemoLogin = async (role: 'developer' | 'owner') => {
    setError(null);
    setDemoLoading(role);

    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Trigger page refresh to synchronize session state
        window.location.href = data.redirectPath || '/dashboard/properties';
      } else {
        setError(data.error || data.message || 'Demo authentication failed. Please try credentials below.');
      }
    } catch {
      setError('Connection error during demo sign-in. You can autofill and sign in with credentials.');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success && result.redirectPath) {
        window.location.href = result.redirectPath;
      } else {
        setError(result.message || 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100 selection:bg-blue-500">
      {/* Background Ambient Luxury Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-blue-600/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-lg bg-[#0c101b]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </Link>
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Aura Signature Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Platform Portal Access</h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sign in to manage 3D spatial properties, camera photogrammetry scans, and client portfolios
            </p>
          </div>
        </div>

        {/* ⚡ Quick 1-Click Instant Demo Testing Buttons */}
        <div className="p-4 bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-purple-950/30 border border-blue-500/30 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-300">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Instant 1-Click Demo Testing</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-mono font-semibold">
              Live Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Click below to instantly sign in without typing passwords. Both accounts give full access to 3D virtual walkthroughs, plans, and camera capture.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              disabled={demoLoading !== null}
              onClick={() => handleDemoLogin('developer')}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {demoLoading === 'developer' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-200 shrink-0" />
              )}
              <span className="truncate">Demo Developer Admin</span>
            </button>

            <button
              type="button"
              disabled={demoLoading !== null}
              onClick={() => handleDemoLogin('owner')}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {demoLoading === 'owner' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              )}
              <span className="truncate">Demo Property Owner</span>
            </button>
          </div>
        </div>

        {/* Setup Incomplete Notice */}
        {setupIncomplete && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-2 animate-in fade-in">
            <div className="flex items-center space-x-2 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Initial Setup Required</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Platform bootstrap has not been completed. Run the setup wizard to create your Master Developer account.
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-colors"
            >
              <span>Launch Setup Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Setup Success Banner */}
        {setupSuccess && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center space-x-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Setup completed successfully! Please authenticate with your new credentials.</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || demoLoading !== null}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.01]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Dashboard</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Expandable Test Credentials Drawer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCredentialsBox(!showCredentialsBox)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1.5 transition-colors border-t border-white/5"
          >
            <span className="font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Direct Credentials &amp; Passwords</span>
            </span>
            {showCredentialsBox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCredentialsBox && (
            <div className="mt-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2.5 text-[11px] animate-in fade-in">
              {/* Dev credentials */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>Developer Admin</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">developer@auraheights.com</div>
                  <div className="text-slate-500 font-mono text-[10px]">DeveloperPassword123!</div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleAutofill('developer@auraheights.com', 'DeveloperPassword123!')}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[10px] font-semibold transition-colors"
                  >
                    Autofill
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('developer@auraheights.com / DeveloperPassword123!', 'dev')}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    title="Copy credentials"
                  >
                    {copiedKey === 'dev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Owner credentials */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span>Business Owner</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">owner@auraheights.com</div>
                  <div className="text-slate-500 font-mono text-[10px]">OwnerPassword2026!</div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleAutofill('owner@auraheights.com', 'OwnerPassword2026!')}
                    className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[10px] font-semibold transition-colors"
                  >
                    Autofill
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('owner@auraheights.com / OwnerPassword2026!', 'owner')}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    title="Copy credentials"
                  >
                    {copiedKey === 'owner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 text-center text-[11px] text-slate-500 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Encrypted TLS Session • Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
