'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShieldAlert,
  ArrowLeft,
  LogOut,
  LayoutGrid,
  List,
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
  const router = useRouter();
  const { user, loading: authLoading, logout, refreshSession } = useAuth();
  const { refreshFlags } = useFeatureFlags();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feature Flags Filter & Search
  const [featureSearch, setFeatureSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'features' | 'storage' | 'ai' | 'owner' | 'split'>('features');
  const [viewMode, setViewMode] = useState<'rails' | 'grid'>('rails');

  // Storage Testing State
  const [testingStorage, setTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Owner Provisioning Form
  const [ownerForm, setOwnerForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  const [ownerProvisioning, setOwnerProvisioning] = useState(false);
  const [ownerSuccess, setOwnerSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user?.isDeveloper || user?.isOwner) {
        fetchConfig();
      } else if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, user]);

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/developer/config', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success && data.config) {
        setConfig(data.config);
      } else {
        setErrorMessage(data.message || data.error || 'Failed to load configuration.');
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

  const handleTestStorage = async () => {
    setTestingStorage(true);
    setStorageTestResult(null);
    try {
      const res = await fetch('/api/developer/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config?.supabaseConfig?.url || '',
          anonKey: config?.supabaseConfig?.anonKey || '',
          serviceRoleKey: config?.supabaseConfig?.serviceRoleKey || '',
          bucket: config?.supabaseConfig?.bucket || 'real-estate-assets',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStorageTestResult({
          success: true,
          message: data.message,
          latencyMs: data.latencyMs,
        });
      } else {
        setStorageTestResult({
          success: false,
          message: data.error || 'Connection verification failed',
        });
      }
    } catch (err: any) {
      setStorageTestResult({
        success: false,
        message: err.message || 'Network test failed',
      });
    } finally {
      setTestingStorage(false);
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

  const enabledCount = useMemo(() => {
    if (!config?.features) return 0;
    return Object.values(config.features).filter(Boolean).length;
  }, [config]);

  const activeAiCount = useMemo(() => {
    if (!config?.aiProviders) return 0;
    return config.aiProviders.filter((p: any) => p.isEnabled).length;
  }, [config]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Connecting to platform configuration service...</p>
        </div>
      </div>
    );
  }

  // Non-developer/non-owner role graceful fallback
  if (user && !user.isDeveloper && !user.isOwner) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900/80 border border-amber-500/20 rounded-3xl text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Platform Master Authority Required</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
            You are authenticated as <span className="text-white font-medium">{user.fullName}</span> ({user.email}).
            The Master Console is restricted to platform developer and primary owner accounts.
            You can access your assigned operational workspaces below.
          </p>
        </div>
        <div className="pt-2 flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard/properties">
            <Button variant="secondary" className="text-xs">
              Go to Operations Desk
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            Switch Account
          </Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xl mx-auto my-12 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Configuration Unavailable</h3>
          <p className="text-xs text-slate-400">{errorMessage || 'SystemConfig document not initialized.'}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={fetchConfig} size="sm">Retry Connection</Button>
          <Link href="/dashboard/properties">
            <Button variant="secondary" size="sm">Dashboard Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 px-1 sm:px-2 py-1">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Developer &amp; Owner Master Console</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
              Live Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Platform Capabilities &amp; System Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Authoritative feature registry, multi-provider AI failover routing, and single-owner provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Link href="/dashboard/owner/audit-feed">
            <Button variant="ghost" size="sm" icon={History} className="text-xs text-slate-300">
              Audit Stream
            </Button>
          </Link>
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            size="sm"
            icon={savedSuccess ? Check : Save}
            className="shadow-lg shadow-emerald-500/20"
          >
            {savedSuccess ? 'Saved Live!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Segmented Control */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-white/10">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'features'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Feature Flags</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] font-mono text-emerald-300">
              {enabledCount}/{FEATURE_REGISTRY.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'storage'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage & Supabase</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              config?.storageProvider === 'supabase'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500/20 text-amber-300'
            }`}>
              {config?.storageProvider === 'supabase' ? 'Supabase' : 'Local'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Failover Engine</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-[10px] font-mono text-purple-300">
              {activeAiCount}/{(config?.aiProviders || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('owner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'owner'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Owner Provisioning</span>
          </button>

          <button
            onClick={() => setActiveTab('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'split'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Scope: <span className="text-emerald-400 font-semibold">{user?.isDeveloper ? 'Developer Master' : 'Primary Owner'}</span>
        </div>
      </div>

      {/* Main Content Areas */}
      {/* 1. Feature Flags Tab */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                All ({FEATURE_REGISTRY.length})
              </button>
              {FEATURE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.key
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-white/[0.02] text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* View Mode Toggle: Rails (Horizontal Stack per Category) or Grid */}
              <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('rails')}
                  title="Horizontal Category Rails"
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                    viewMode === 'rails'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Rails</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Compact Grid"
                  className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[10px]">Grid</span>
                </button>
              </div>

              <div className="w-full sm:w-60 flex-shrink-0">
                <SearchInput
                  value={featureSearch}
                  onValueChange={setFeatureSearch}
                  placeholder="Search feature flags..."
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* Feature Cards: Rails (Horizontal Stack per Category) or Compact Grid */}
          {viewMode === 'rails' && activeCategory === 'all' && !featureSearch ? (
            <div className="space-y-3.5">
              {FEATURE_CATEGORIES.map((cat) => {
                const catFeatures = FEATURE_REGISTRY.filter((f) => f.category === cat.key);
                if (catFeatures.length === 0) return null;
                const activeInCat = catFeatures.filter((f) => !!config.features?.[f.key]).length;

                return (
                  <div key={cat.key} className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white tracking-tight">{cat.label}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                          {activeInCat}/{catFeatures.length} Active
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                        Horizontal Rail &rarr;
                      </span>
                    </div>

                    {/* Horizontal Scroll Rail */}
                    <div className="horizontal-scroll-rail pb-2 pt-0.5">
                      {catFeatures.map((feat) => {
                        const isEnabled = !!config.features?.[feat.key];
                        return (
                          <div
                            key={feat.key}
                            className={`w-[280px] sm:w-[300px] flex-shrink-0 p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                              isEnabled
                                ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm shadow-emerald-950/20'
                                : 'bg-slate-900/60 border-white/5 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-white tracking-tight truncate">{feat.label}</h4>
                                  <span className="font-mono text-[9px] text-slate-400 block truncate">{feat.key}</span>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onChange={() => handleToggleFeature(feat.key)}
                                  size="sm"
                                />
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-tight">
                                {feat.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 uppercase tracking-wider font-medium">
                                Scope: <span className="text-slate-300">{feat.scope}</span>
                              </span>
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
                                  isEnabled
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border-white/5'
                                }`}
                              >
                                {isEnabled ? 'ACTIVE' : 'OFF'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredFeatures.map((feat) => {
                const isEnabled = !!config.features?.[feat.key];

                return (
                  <div
                    key={feat.key}
                    className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isEnabled
                        ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm shadow-emerald-950/20'
                        : 'bg-slate-900/50 border-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white tracking-tight truncate">{feat.label}</h4>
                          <span className="font-mono text-[9px] text-slate-400 block truncate">{feat.key}</span>
                        </div>

                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggleFeature(feat.key)}
                          size="sm"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-tight">
                        {feat.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 uppercase tracking-wider font-medium">
                        Scope: <span className="text-slate-300">{feat.scope}</span>
                      </span>

                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
                          isEnabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-white/5'
                        }`}
                      >
                        {isEnabled ? 'ACTIVE' : 'OFF'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. AI Multi-Provider Tab */}
      {activeTab === 'ai' && (
        <div className="max-w-3xl mx-auto space-y-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                AI Multi-Provider Priority Failover Engine
              </h2>
              <p className="text-xs text-slate-400">
                Transparent fallback chain: Provider #1 is queried first, failing over to Provider #2 if rate-limited.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {(config.aiProviders || []).map((provider: any, idx: number) => (
              <div
                key={provider.id}
                className="p-3.5 bg-slate-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{provider.name}</span>
                      <span className="text-[9px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                        {provider.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Model: {provider.modelName || 'default'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleProviderMove(idx, 'up')}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === config.aiProviders.length - 1}
                      onClick={() => handleProviderMove(idx, 'down')}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
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
      )}

      {/* 2. Cloud Storage & Supabase Tab */}
      {activeTab === 'storage' && (
        <div className="max-w-3xl mx-auto space-y-5 p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Cloud Storage &amp; Supabase Engine
                </h2>
                <p className="text-xs text-slate-400">
                  Manage persistent object storage for AI photogrammetry captures, 3D models, and architectural plans.
                </p>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              config?.storageProvider === 'supabase'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {config?.storageProvider === 'supabase' ? '🟢 Supabase Active' : '🟡 Local Active'}
            </span>
          </div>

          {/* Provider Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Active Storage Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Supabase Option */}
              <div
                onClick={() => setConfig({ ...config, storageProvider: 'supabase' })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config?.storageProvider === 'supabase'
                    ? 'bg-blue-600/15 border-blue-500/60 ring-1 ring-blue-500/30'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border ${
                      config?.storageProvider === 'supabase'
                        ? 'bg-blue-500 border-blue-400'
                        : 'border-slate-500'
                    }`} />
                    <span className="text-xs font-bold text-white">Supabase Cloud Storage</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                    PRODUCTION READY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Direct browser uploads bypass Vercel&apos;s 4.5MB limit. Zero ephemeral disk loss. Durable worldwide cloud asset delivery.
                </p>
              </div>

              {/* Local Storage Option */}
              <div
                onClick={() => setConfig({ ...config, storageProvider: 'local' })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  config?.storageProvider === 'local'
                    ? 'bg-amber-600/15 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border ${
                      config?.storageProvider === 'local'
                        ? 'bg-amber-500 border-amber-400'
                        : 'border-slate-500'
                    }`} />
                    <span className="text-xs font-bold text-white">Local Filesystem</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                    DEV ONLY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Saves assets directly to <code>storage/scans</code> on your machine. Not persistent across Vercel serverless function invocations.
                </p>
              </div>
            </div>
          </div>

          {/* Supabase Credentials Configuration Form */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">
              Supabase Project Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={config?.supabaseConfig?.url || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supabaseConfig: { ...config?.supabaseConfig, url: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anon / Public API Key <span className="text-rose-400">*</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1.5">(Used for direct browser uploads)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config?.supabaseConfig?.anonKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supabaseConfig: { ...config?.supabaseConfig, anonKey: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Service Role Key <span className="text-rose-400">*</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1.5">(Backend deletion &amp; bucket admin)</span>
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={config?.supabaseConfig?.serviceRoleKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supabaseConfig: { ...config?.supabaseConfig, serviceRoleKey: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Storage Bucket Name
                </label>
                <input
                  type="text"
                  placeholder="real-estate-assets"
                  value={config?.supabaseConfig?.bucket || 'real-estate-assets'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supabaseConfig: { ...config?.supabaseConfig, bucket: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                />
              </div>
            </div>

            {/* Test Connection Feedback */}
            {storageTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  storageTestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {storageTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  )}
                  <span>{storageTestResult.message}</span>
                </div>
                {storageTestResult.latencyMs && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                    {storageTestResult.latencyMs}ms
                  </span>
                )}
              </div>
            )}

            {/* Storage Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={testingStorage}
                onClick={handleTestStorage}
                className="text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                <span>Test Connection &amp; Ensure Bucket</span>
              </Button>

              <Button
                type="button"
                size="sm"
                loading={saving}
                onClick={handleSaveConfig}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Save Storage Provider Settings</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Owner Provisioning Tab */}
      {activeTab === 'owner' && (
        <div className="max-w-2xl mx-auto space-y-4 p-5 rounded-2xl bg-slate-900/40 border border-white/5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Provision Primary Owner Account
              </h2>
              <p className="text-xs text-slate-400">
                The primary Owner has authoritative executive oversight over agency sales, leads, and assets.
              </p>
            </div>
          </div>

          {ownerSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Owner account successfully provisioned and ready for login!</span>
            </div>
          ) : (
            <form onSubmit={handleProvisionOwner} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={ownerForm.fullName}
                  onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={ownerForm.email}
                  onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={ownerForm.phone}
                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="sm:col-span-2 pt-1">
                <Button type="submit" loading={ownerProvisioning} size="sm">
                  Provision Primary Owner
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 4. Split Studio View (Side-by-Side: All visible on screen) */}
      {activeTab === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Features with custom scrollbar */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Feature Flags ({enabledCount}/{FEATURE_REGISTRY.length})
              </span>
              <div className="w-48">
                <SearchInput
                  value={featureSearch}
                  onValueChange={setFeatureSearch}
                  placeholder="Filter..."
                  size="sm"
                />
              </div>
            </div>

            <div className="max-h-[calc(100vh-210px)] overflow-y-auto pr-1.5 custom-scrollbar space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredFeatures.map((feat) => {
                  const isEnabled = !!config.features?.[feat.key];
                  return (
                    <div
                      key={feat.key}
                      className={`p-3 rounded-xl border ${
                        isEnabled
                          ? 'bg-emerald-950/15 border-emerald-500/30'
                          : 'bg-slate-900/40 border-white/5 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-white truncate">{feat.label}</h4>
                          <span className="font-mono text-[9px] text-slate-400 block truncate">{feat.key}</span>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onChange={() => handleToggleFeature(feat.key)}
                          size="sm"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-1">{feat.description}</p>
                      <div className="text-[9px] font-mono text-slate-500 uppercase">Scope: {feat.scope}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: AI and Owner side by side or stacked compactly */}
          <div className="lg:col-span-5 space-y-4">
            {/* AI Providers */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Providers Priority Chain</span>
              </div>
              <div className="space-y-2">
                {(config.aiProviders || []).map((provider: any, idx: number) => (
                  <div
                    key={provider.id}
                    className="p-2.5 bg-slate-950/60 border border-white/5 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white truncate">{provider.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleProviderMove(idx, 'up')}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === config.aiProviders.length - 1}
                        onClick={() => handleProviderMove(idx, 'down')}
                        className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
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

            {/* Owner Provisioning Form */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Provision Primary Owner</span>
              </div>
              {ownerSuccess ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Owner successfully provisioned!</span>
                </div>
              ) : (
                <form onSubmit={handleProvisionOwner} className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Name</label>
                    <input
                      type="text"
                      required
                      value={ownerForm.fullName}
                      onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Email</label>
                    <input
                      type="email"
                      required
                      value={ownerForm.email}
                      onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Password</label>
                    <input
                      type="password"
                      required
                      value={ownerForm.password}
                      onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Phone</label>
                    <input
                      type="text"
                      value={ownerForm.phone}
                      onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div className="col-span-2 pt-1">
                    <Button type="submit" loading={ownerProvisioning} size="sm" className="w-full">
                      Provision Owner
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
