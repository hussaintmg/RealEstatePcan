'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Building2, Lock, Mail, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Fetch session to decide destination
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user?.isDeveloper) {
          router.push('/dashboard/developer');
        } else if (data.user?.isOwner) {
          router.push('/dashboard/owner');
        } else if (data.user?.roleId) {
          router.push('/dashboard/properties');
        } else {
          router.push('/portal');
        }
      } else {
        setError('Invalid credentials or account is deactivated.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col justify-center items-center p-4 relative overflow-hidden text-white selection:bg-blue-500">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 blur-[130px] rounded-full pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-[#101522]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Portal Access</h1>
          <p className="text-xs text-slate-400">
            Secure login for Developers, Owners, Staff, &amp; Verified Clients
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@system.local or client@domain.com"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authenticate &amp; Enter</span>}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Credentials Info / Seed Guide */}
        <div className="pt-4 border-t border-white/10 space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1 text-slate-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Developer Default Credentials:</span>
          </div>
          <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] space-y-1 text-slate-300">
            <div>Email: <span className="text-blue-300">developer@system.local</span></div>
            <div>Pass: <span className="text-blue-300">DeveloperMaster2026!</span></div>
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            No public registration: Customer accounts are provisioned via verified lead conversion.
          </p>
        </div>
      </div>
    </div>
  );
}
