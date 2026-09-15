'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  History,
  Sparkles,
  Layers,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { SearchInput } from '@/components/ui/SearchInput';
import {
  FEATURE_REGISTRY,
  FEATURE_CATEGORIES,
  FeatureCategory,
  FeatureDefinition,
} from '@/lib/features/registry';

export default function DeveloperConsolePage() {
  const { user, refreshSession } = useAuth();
  const { refreshFlags } = useFeatureFlags();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature Flags Filter & Search
  const [featureSearch, setFeatureSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Owner Provisioning Form
  const [ownerForm, setOwnerForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [ownerProvisioning, setOwnerProvisioning] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        setErrorMessage(data.message || 'Failed to load configuration.');
      }
    } catch {
      setErrorMessage('Network error while connecting to configuration endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (key: string) => {
    if (!config) return;
    const current = !!config.features?.[key];
    const next = !current;

    setConfig((prev: any) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: next,
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

    updated.forEach((p, idx) => {
      p.priority = idx + 1;
    });

    setConfig({ ...config, aiProviders: updated });
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSuccess(true);
        await Promise.all([refreshFlags(), refreshSession()]);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to save configuration.');
      }
    } catch {
      setErrorMessage('Error communicating with system configuration service.');
    } finally {
      setSaving(false);
    }
  };

  const handleProvisionOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerProvisioning(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/provision-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ownerForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOwnerSuccess(true);
        setOwnerForm({ fullName: '', email: '', password: '', phone: '' });
      } else {
        setErrorMessage(data.message || 'Owner provisioning failed.');
      }
    } catch {
      setErrorMessage('Error communicating with server.');
    } finally {
      setOwnerProvisioning(false);
    }
  };

  // Filtered feature flags list
  const filteredFeatures = useMemo(() => {
    return FEATURE_REGISTRY.filter((f) => {
      const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
      const matchesSearch =
        !featureSearch.trim() ||
        f.label.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.key.toLowerCase().includes(featureSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(featureSearch.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [featureSearch, activeCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Connecting to platform configuration service...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xl mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Configuration Unavailable</h3>
        <p className="text-xs text-slate-400 mb-4">{errorMessage || 'SystemConfig document not initialized.'}</p>
        <Button onClick={fetchConfig}>Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Developer Master Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Capabilities &amp; Feature Flags
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control platform switches, data scoping, AI failover priorities, and monitor mutation audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/owner/audit-feed">
            <Button variant="ghost" size="sm" icon={History} className="text-xs text-slate-300">
              Audit Stream
            </Button>
          </Link>
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            icon={savedSuccess ? Check : Save}
            className="shadow-lg shadow-emerald-500/20"
          >
            {savedSuccess ? 'Changes Applied Live!' : 'Save System Configuration'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Feature Flags Registry Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Authoritative Feature Flags
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Disabled features are unmounted from navigation and strictly blocked at the API layer with 403 Forbidden.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <SearchInput
              value={featureSearch}
              onValueChange={setFeatureSearch}
              placeholder="Filter feature flags..."
              size="sm"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            All Categories
          </button>
          {FEATURE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeatures.map((feat) => {
            const isEnabled = !!config.features?.[feat.key];

            return (
              <div
                key={feat.key}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  isEnabled
                    ? 'bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-900/40 border-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{feat.label}</h3>
                      <span className="font-mono text-[10px] text-slate-400">{feat.key}</span>
                    </div>

                    {/* Capsule Switch Component */}
                    <Switch
                      checked={isEnabled}
                      onChange={() => handleToggleFeature(feat.key)}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 uppercase tracking-wider font-medium">
                    Scope: <span className="text-slate-300">{feat.scope}</span>
                  </span>

                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md border ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}
                  >
                    {isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. AI Multi-Provider Fallback Chain */}
      <div className="space-y-4 pt-8 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            AI Multi-Provider Priority Failover Engine
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          The system queries Provider #1 first. If rate-limited or unavailable, it transparently falls back to Provider #2.
        </p>

        <div className="space-y-3">
          {(config.aiProviders || []).map((provider: any, idx: number) => (
            <div
              key={provider.id}
              className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{provider.name}</span>
                    <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400">
                      {provider.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Model: {provider.modelName || 'default'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleProviderMove(idx, 'up')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={idx === config.aiProviders.length - 1}
                    onClick={() => handleProviderMove(idx, 'down')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <Switch
                  checked={provider.isEnabled}
                  onChange={(checked) => {
                    const updated = [...config.aiProviders];
                    updated[idx].isEnabled = checked;
                    setConfig({ ...config, aiProviders: updated });
                  }}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Owner Provisioning */}
      <div className="space-y-4 pt-8 border-t border-white/10">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Provision Primary Owner Account
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          The primary Owner oversees company operations, leads, properties, and live audit streams.
        </p>

        {ownerSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Owner account successfully provisioned and ready for login!</span>
          </div>
        ) : (
          <form onSubmit={handleProvisionOwner} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={ownerForm.fullName}
                onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Initial Password</label>
              <input
                type="password"
                required
                value={ownerForm.password}
                onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone (Optional)</label>
              <input
                type="text"
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <Button type="submit" loading={ownerProvisioning}>
                Provision Primary Owner
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
