'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import {
  Sliders,
  Bot,
  HardDrive,
  UserPlus,
  ShieldCheck,
  Save,
  Check,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export default function DeveloperConsolePage() {
  const { user } = useAuth();
  const { refreshFlags } = useFeatureFlags();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Owner Provisioning Form
  const [ownerForm, setOwnerForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [ownerProvisioning, setOwnerProvisioning] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/developer/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (key: string) => {
    setConfig((prev: any) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const handleProviderMove = (index: number, direction: 'up' | 'down') => {
    if (!config?.aiProviders) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.aiProviders.length) return;

    const updated = [...config.aiProviders];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Recalculate priority numbers
    updated.forEach((p, idx) => {
      p.priority = idx + 1;
    });

    setConfig({ ...config, aiProviders: updated });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/developer/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSavedSuccess(true);
        await refreshFlags();
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerProvisioning(true);
    try {
      const res = await fetch('/api/developer/provision-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerForm),
      });
      if (res.ok) {
        setOwnerSuccess(true);
        setOwnerForm({ fullName: '', email: '', password: '', phone: '' });
        setTimeout(() => setOwnerSuccess(false), 3000);
      }
    } finally {
      setOwnerProvisioning(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading Developer Master Controls...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Master Developer Authority</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            System Configuration &amp; Feature Flags
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Toggle global capabilities, configure AI failover ordering, and manage asset storage.
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Changes Saved Live!' : 'Save System Settings'}</span>
        </button>
      </div>

      {/* 1. Feature Flag Switches */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-bold text-white">Dynamic Global Feature Flags</h3>
        </div>
        <p className="text-xs text-slate-400">
          Disabling any feature unmounts it from the UI navigation and blocks its API with a strict 403 Forbidden.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(config.features || {}).map(([key, enabled]) => (
            <div
              key={key}
              onClick={() => handleToggleFeature(key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                enabled
                  ? 'bg-blue-600/10 border-blue-500/30 text-white'
                  : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="text-xs font-bold capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {enabled ? 'Active on public & portal' : 'Blocked & hidden'}
                </div>
              </div>

              {enabled ? (
                <ToggleRight className="w-7 h-7 text-blue-400 flex-shrink-0" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. AI Multi-Provider Fallback Chain */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <h3 className="text-base font-bold text-white">AI Multi-Provider Priority Failover Engine</h3>
        </div>
        <p className="text-xs text-slate-400">
          The system queries Provider #1 first. If rate-limited or unavailable, it transparently falls back to Provider #2, maintaining MongoDB sliding-window session memory.
        </p>

        <div className="space-y-3">
          {(config.aiProviders || []).map((provider: any, idx: number) => (
            <div
              key={provider.id}
              className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>{provider.name}</span>
                    <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400">
                      {provider.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Model: {provider.modelName}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  value={provider.apiKey || ''}
                  onChange={(e) => {
                    const updated = [...config.aiProviders];
                    updated[idx].apiKey = e.target.value;
                    setConfig({ ...config, aiProviders: updated });
                  }}
                  placeholder="API Key (or env default)"
                  className="w-48 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                />

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleProviderMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleProviderMove(idx, 'down')}
                    disabled={idx === config.aiProviders.length - 1}
                    className="p-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg text-slate-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Storage Provider Configuration */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Asset Storage Engine (Direct Supabase vs Local)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setConfig({ ...config, storageProvider: 'supabase' })}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              config.storageProvider === 'supabase'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                : 'bg-white/[0.02] border-white/10 text-slate-400'
            }`}
          >
            <div className="text-sm font-bold">Supabase Cloud S3 Storage (Recommended)</div>
            <p className="text-xs text-slate-400 mt-1">
              Direct bufferless client-to-Supabase upload for heavy 3D GLB models and videos.
            </p>
          </div>

          <div
            onClick={() => setConfig({ ...config, storageProvider: 'local' })}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              config.storageProvider === 'local'
                ? 'bg-blue-500/10 border-blue-500/30 text-white'
                : 'bg-white/[0.02] border-white/10 text-slate-400'
            }`}
          >
            <div className="text-sm font-bold">Local File Storage (/public/uploads)</div>
            <p className="text-xs text-slate-400 mt-1">
              Saves assets directly to the application server filesystem.
            </p>
          </div>
        </div>

        {config.storageProvider === 'supabase' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-2xl text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={config.supabaseConfig?.url || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    supabaseConfig: { ...config.supabaseConfig, url: e.target.value },
                  })
                }
                placeholder="https://xyz.supabase.co"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Supabase Anon Key (Public for Client Uploads)</label>
              <input
                type="password"
                value={config.supabaseConfig?.anonKey || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    supabaseConfig: { ...config.supabaseConfig, anonKey: e.target.value },
                  })
                }
                placeholder="eyJh..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Provision Company Owner */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-bold text-white">Provision Company Owner Account</h3>
        </div>
        <p className="text-xs text-slate-400">
          Developers setup the Owner. The Owner receives full control over properties, leads, customer conversions, invoices, and dynamic RBAC roles.
        </p>

        {ownerSuccess ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>Owner account provisioned successfully! They can now log in.</span>
          </div>
        ) : (
          <form onSubmit={handleProvisionOwner} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Owner Full Name</label>
              <input
                type="text"
                required
                value={ownerForm.fullName}
                onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                placeholder="Sheikh Rashid Al-Mansoor"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Owner Email</label>
              <input
                type="email"
                required
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                placeholder="owner@auraheights.com"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={ownerForm.password}
                onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={ownerProvisioning}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
              >
                {ownerProvisioning ? 'Provisioning...' : 'Create Owner Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
