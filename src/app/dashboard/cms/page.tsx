'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableVariableModal } from '@/components/cms/DraggableVariableModal';
import { DynamicCmsIcon } from '@/lib/cms/iconResolver';
import { IconPicker } from '@/components/cms/IconPicker';
import {
  Layers,
  Sparkles,
  Save,
  Check,
  Film,
  Compass,
  Home,
  FileText,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Laptop,
  Tablet,
  Smartphone,
  Globe,
  Settings,
  ArrowUp,
  ArrowDown,
  Loader2,
  ExternalLink,
  HelpCircle,
  Calculator,
  MessageSquare,
  Building2,
  Menu,
  Palette,
  Image as ImageIcon,
  Database,
  ShieldAlert,
  FolderOpen,
  Copy,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Share2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Code,
  Tag,
} from 'lucide-react';

type CmsTab = 'dashboard' | 'pages' | 'navigation' | 'design' | 'media' | 'variables' | 'templates' | 'integrity';

export default function CmsStudioPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>('dashboard');

  // --- TAB 1: OVERVIEW DASHBOARD STATS ---
  const [stats, setStats] = useState({
    pagesCount: 5,
    layoutsCount: 3,
    assetsCount: 8,
    variablesCount: 42,
    issuesCount: 0,
  });

  // --- TAB 2: PAGE BUILDER STATE ---
  const [pages, setPages] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pageSaving, setPageSaving] = useState(false);
  const [pageSaved, setPageSaved] = useState(false);
  const [variableModalOpen, setVariableModalOpen] = useState(false);

  // --- TAB 3: NAVIGATION LAYOUTS STATE ---
  const [layouts, setLayouts] = useState<any[]>([]);
  const [selectedLayoutType, setSelectedLayoutType] = useState<'navbar' | 'footer' | 'topbar'>('navbar');
  const [currentLayout, setCurrentLayout] = useState<any>(null);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);

  // --- TAB 4: THEME & DESIGN TOKENS STATE ---
  const [theme, setTheme] = useState<any>(null);
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);

  // --- TAB 5: MEDIA & ASSETS STATE ---
  const [assets, setAssets] = useState<any[]>([]);
  const [assetCategory, setAssetCategory] = useState('all');
  const [assetSearch, setAssetSearch] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetTitle, setNewAssetTitle] = useState('');
  const [newAssetType, setNewAssetType] = useState<'image' | 'video' | '3d_model' | 'document'>('image');

  // --- TAB 6: VARIABLES STATE ---
  const [variables, setVariables] = useState<any[]>([]);
  const [varSearch, setVarSearch] = useState('');
  const [varCategory, setVarCategory] = useState('all');
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  // --- TAB 7: INTEGRITY CHECKER STATE ---
  const [integrityReport, setIntegrityReport] = useState<any>(null);
  const [scanningIntegrity, setScanningIntegrity] = useState(false);

  // Load initial data
  useEffect(() => {
    // 1. Load CMS Pages
    fetch('/api/cms/pages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pages) {
          setPages(data.pages);
          const home = data.pages.find((p: any) => p.slug === 'home') || data.pages[0];
          if (home) {
            setSelectedSlug(home.slug);
            setCurrentPage(home);
          }
          setStats((prev) => ({ ...prev, pagesCount: data.pages.length }));
        }
      })
      .catch(() => {});

    // 2. Load CMS Layouts
    fetch('/api/cms/layouts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.layouts) {
          setLayouts(data.layouts);
          const nav = data.layouts.find((l: any) => l.type === 'navbar') || data.layouts[0];
          setCurrentLayout(nav);
          setStats((prev) => ({ ...prev, layoutsCount: data.layouts.length }));
        }
      })
      .catch(() => {});

    // 3. Load CMS Theme
    fetch('/api/cms/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.theme) {
          setTheme(data.theme);
        }
      })
      .catch(() => {});

    // 4. Load CMS Assets
    fetch('/api/cms/assets')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.assets) {
          setAssets(data.assets);
          setStats((prev) => ({ ...prev, assetsCount: data.assets.length }));
        }
      })
      .catch(() => {});

    // 5. Load CMS Variables
    fetch('/api/cms/variables')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.variables) {
          setVariables(data.variables);
          setStats((prev) => ({ ...prev, variablesCount: data.variables.length }));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch page on slug change
  const handlePageSelect = async (slug: string) => {
    setSelectedSlug(slug);
    setSelectedBlockId(null);
    try {
      const res = await fetch(`/api/cms/pages?slug=${slug}`);
      const data = await res.json();
      if (data.success && data.page) {
        setCurrentPage(data.page);
      }
    } catch {}
  };

  // Save Page
  const handleSavePage = async () => {
    if (!currentPage) return;
    setPageSaving(true);
    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPage),
      });
      const data = await res.json();
      if (data.success) {
        setPageSaved(true);
        setTimeout(() => setPageSaved(false), 2500);
      }
    } finally {
      setPageSaving(false);
    }
  };

  // Save Layout
  const handleSaveLayout = async () => {
    if (!currentLayout) return;
    setLayoutSaving(true);
    try {
      const res = await fetch('/api/cms/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLayout),
      });
      const data = await res.json();
      if (data.success) {
        setLayoutSaved(true);
        setTimeout(() => setLayoutSaved(false), 2500);
      }
    } finally {
      setLayoutSaving(false);
    }
  };

  // Save Theme / Design Tokens
  const handleSaveTheme = async () => {
    if (!theme) return;
    setThemeSaving(true);
    try {
      const res = await fetch('/api/cms/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      const data = await res.json();
      if (data.success) {
        setThemeSaved(true);
        setTimeout(() => setThemeSaved(false), 2500);
      }
    } finally {
      setThemeSaving(false);
    }
  };

  // Run Integrity Check
  const handleRunIntegrityCheck = async () => {
    setScanningIntegrity(true);
    try {
      const res = await fetch('/api/cms/integrity');
      const data = await res.json();
      if (data.success && data.report) {
        setIntegrityReport(data.report);
        setStats((prev) => ({ ...prev, issuesCount: data.report.totalIssues }));
      }
    } finally {
      setScanningIntegrity(false);
    }
  };

  // Add Asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetUrl.trim()) return;
    try {
      const res = await fetch('/api/cms/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAssetTitle || 'New Media Asset',
          filename: newAssetUrl.split('/').pop() || 'asset.jpg',
          url: newAssetUrl,
          fileType: newAssetType,
          category: assetCategory === 'all' ? 'general' : assetCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.asset) {
        setAssets((prev) => [data.asset, ...prev]);
        setNewAssetUrl('');
        setNewAssetTitle('');
      }
    } catch {}
  };

  // Add Variable
  const handleAddVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim() || !newVarLabel.trim()) return;
    try {
      const res = await fetch('/api/cms/variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newVarKey,
          label: newVarLabel,
          value: newVarValue,
          type: 'string',
          source: 'static',
        }),
      });
      const data = await res.json();
      if (data.success && data.variable) {
        setVariables((prev) => [...prev, data.variable]);
        setNewVarKey('');
        setNewVarLabel('');
        setNewVarValue('');
      }
    } catch {}
  };

  const selectedBlock = currentPage?.sections?.find((s: any) => s.id === selectedBlockId);

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP STUDIO NAVIGATION TABS */}
      <header className="sticky top-0 z-40 bg-[#0d121d] border-b border-white/10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black tracking-tight text-white">AURA CMS STUDIO</span>
              <span className="px-2 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 font-bold rounded-full uppercase tracking-wider">
                Enterprise v2.0
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Universal Website &amp; Design Architecture</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-2xl border border-white/10 text-xs">
          {[
            { id: 'dashboard', label: 'Overview', icon: Home },
            { id: 'pages', label: 'Page Builder', icon: FileText },
            { id: 'navigation', label: 'Navigation', icon: Menu },
            { id: 'design', label: 'Design Tokens', icon: Palette },
            { id: 'media', label: 'Media Library', icon: ImageIcon },
            { id: 'variables', label: 'Variables', icon: Database },
            { id: 'integrity', label: 'Integrity Scan', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CmsTab)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Website Preview Button */}
        <div className="flex items-center space-x-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Visit Live Site</span>
          </Link>
        </div>
      </header>

      {/* 2. SUB-MODULE RENDERER */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* ============================================================ */}
        {/* SUB-MODULE 1: OVERVIEW DASHBOARD */}
        {/* ============================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 max-w-6xl mx-auto py-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight text-white">CMS Architecture Control Center</h1>
              <p className="text-xs text-slate-400">
                Manage your public website chrome, dynamic pages, design tokens, brand assets, and database variables without touching source code.
              </p>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div
                onClick={() => setActiveTab('pages')}
                className="p-5 bg-[#101522] border border-white/10 rounded-2xl space-y-2 cursor-pointer hover:border-blue-500/50 transition-all group"
              >
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white block">{stats.pagesCount}</span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Active CMS Pages</span>
              </div>

              <div
                onClick={() => setActiveTab('navigation')}
                className="p-5 bg-[#101522] border border-white/10 rounded-2xl space-y-2 cursor-pointer hover:border-indigo-500/50 transition-all group"
              >
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <Menu className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white block">{stats.layoutsCount}</span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Nav &amp; Footers</span>
              </div>

              <div
                onClick={() => setActiveTab('media')}
                className="p-5 bg-[#101522] border border-white/10 rounded-2xl space-y-2 cursor-pointer hover:border-emerald-500/50 transition-all group"
              >
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white block">{stats.assetsCount}</span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Media Assets</span>
              </div>

              <div
                onClick={() => setActiveTab('variables')}
                className="p-5 bg-[#101522] border border-white/10 rounded-2xl space-y-2 cursor-pointer hover:border-amber-500/50 transition-all group"
              >
                <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white block">{stats.variablesCount}</span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Discovered Vars</span>
              </div>

              <div
                onClick={() => setActiveTab('integrity')}
                className="p-5 bg-[#101522] border border-white/10 rounded-2xl space-y-2 cursor-pointer hover:border-purple-500/50 transition-all group"
              >
                <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-white block">{stats.issuesCount}</span>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Integrity Issues</span>
              </div>
            </div>

            {/* Quick Actions & Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Visual Page Builder</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compose page block stacks with live Framer Motion animations, mobile responsive views, and model variable interpolation.
                </p>
                <button
                  onClick={() => setActiveTab('pages')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
                >
                  Open Page Builder
                </button>
              </div>

              <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4">
                <div className="flex items-center space-x-2.5">
                  <Menu className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Navigation &amp; Footer Builder</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create custom topbars, navbars, and multi-column footers. Add nested menu trees, icons, and auth conditions without code edits.
                </p>
                <button
                  onClick={() => setActiveTab('navigation')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Manage Navbars &amp; Footers
                </button>
              </div>

              <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4">
                <div className="flex items-center space-x-2.5">
                  <Palette className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Brand &amp; Design Tokens</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Update primary logos, brand identity, color tokens, and typography presets. Changes immediately propagate across all components.
                </p>
                <button
                  onClick={() => setActiveTab('design')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  Edit Brand &amp; Design Tokens
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 2: VISUAL PAGE BUILDER */}
        {/* ============================================================ */}
        {activeTab === 'pages' && currentPage && (
          <div className="space-y-6">
            {/* Page Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#101522] border border-white/10 rounded-2xl">
              <div className="flex items-center space-x-3">
                <select
                  value={selectedSlug}
                  onChange={(e) => handlePageSelect(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="home">Home Page (slug: home)</option>
                  <option value="developments">Signature Estates (slug: developments)</option>
                  <option value="about">About The Agency (slug: about)</option>
                  <option value="neighborhoods">Neighborhood Guides (slug: neighborhoods)</option>
                  <option value="contact">VIP Client Advisory (slug: contact)</option>
                </select>

                <div className="flex items-center space-x-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>/{currentPage.slug === 'home' ? '' : `c/${currentPage.slug}`}</span>
                </div>
              </div>

              {/* Viewport & Save Actions */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewportMode('desktop')}
                    className={`p-1.5 rounded-lg transition-all ${viewportMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Desktop View"
                  >
                    <Laptop className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('tablet')}
                    className={`p-1.5 rounded-lg transition-all ${viewportMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Tablet View"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewportMode('mobile')}
                    className={`p-1.5 rounded-lg transition-all ${viewportMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setVariableModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Variables</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePage}
                  disabled={pageSaving}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                >
                  {pageSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pageSaved ? (
                    <Check className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{pageSaved ? 'Saved' : 'Save Page'}</span>
                </button>
              </div>
            </div>

            {/* DUAL PANE: Block Stack & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Pane: Block Stack & Inspector */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#101522] border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Page Sections Stack</span>
                    <span className="text-[11px] text-slate-400">{currentPage.sections?.length || 0} Sections</span>
                  </div>

                  {/* Section List */}
                  <div className="space-y-2">
                    {currentPage.sections?.map((sec: any, idx: number) => {
                      const isSelected = selectedBlockId === sec.id;
                      return (
                        <div
                          key={sec.id}
                          onClick={() => setSelectedBlockId(sec.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-600/20'
                              : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <span className="text-[11px] font-mono text-slate-500">{idx + 1}</span>
                            <span className="text-xs font-semibold text-white truncate">{sec.title || sec.type}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            {/* Toggle visibility */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = currentPage.sections.map((s: any) =>
                                  s.id === sec.id ? { ...s, isVisible: !s.isVisible } : s
                                );
                                setCurrentPage({ ...currentPage, sections: updated });
                              }}
                              className="p-1 text-slate-400 hover:text-white"
                              title="Toggle Visibility"
                            >
                              {sec.isVisible !== false ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                            </button>

                            {/* Move Up */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const list = [...currentPage.sections];
                                  const temp = list[idx - 1];
                                  list[idx - 1] = list[idx];
                                  list[idx] = temp;
                                  setCurrentPage({ ...currentPage, sections: list });
                                }}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Move Down */}
                            {idx < currentPage.sections.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const list = [...currentPage.sections];
                                  const temp = list[idx + 1];
                                  list[idx + 1] = list[idx];
                                  list[idx] = temp;
                                  setCurrentPage({ ...currentPage, sections: list });
                                }}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section Inspector if block selected */}
                {selectedBlock && (
                  <div className="bg-[#101522] border border-white/10 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Inspector: {selectedBlock.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBlockId(null)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        Done
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Section Title</label>
                        <input
                          type="text"
                          value={selectedBlock.title || ''}
                          onChange={(e) => {
                            const updated = currentPage.sections.map((s: any) =>
                              s.id === selectedBlock.id ? { ...s, title: e.target.value } : s
                            );
                            setCurrentPage({ ...currentPage, sections: updated });
                          }}
                          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Content Fields */}
                      {Object.keys(selectedBlock.content || {}).map((fieldKey) => {
                        const val = selectedBlock.content[fieldKey];
                        if (typeof val !== 'string' && typeof val !== 'number') return null;
                        return (
                          <div key={fieldKey}>
                            <label className="block text-slate-400 mb-1 capitalize">
                              {fieldKey.replace(/([A-Z])/g, ' $1')}
                            </label>
                            <input
                              type="text"
                              value={String(val)}
                              onChange={(e) => {
                                const updatedContent = { ...selectedBlock.content, [fieldKey]: e.target.value };
                                const updated = currentPage.sections.map((s: any) =>
                                  s.id === selectedBlock.id ? { ...s, content: updatedContent } : s
                                );
                                setCurrentPage({ ...currentPage, sections: updated });
                              }}
                              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Pane: Live Viewport Preview Frame */}
              <div className="lg:col-span-7 flex justify-center bg-black/40 p-4 rounded-3xl border border-white/10 overflow-hidden min-h-[680px]">
                <div
                  className="bg-[#0a0d14] rounded-2xl overflow-y-auto border border-white/10 shadow-2xl transition-all duration-300 w-full"
                  style={{
                    maxWidth:
                      viewportMode === 'mobile'
                        ? '375px'
                        : viewportMode === 'tablet'
                        ? '768px'
                        : '100%',
                    height: '640px',
                  }}
                >
                  <div className="p-4 space-y-4">
                    {currentPage.sections?.map((sec: any) => (
                      <div
                        key={sec.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          sec.isVisible === false ? 'opacity-40 border-dashed border-white/10' : 'border-white/10 bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
                          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">{sec.type}</span>
                          <span className="text-xs font-bold text-white">{sec.title}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white">
                          {sec.content?.heading || sec.content?.title || sec.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {sec.content?.subheading || sec.content?.desc || 'Interactive CMS section content.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 3: NAVIGATION & FOOTER LAYOUTS */}
        {/* ============================================================ */}
        {activeTab === 'navigation' && currentLayout && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#101522] border border-white/10 rounded-2xl">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLayoutType('navbar');
                    const found = layouts.find((l: any) => l.type === 'navbar');
                    if (found) setCurrentLayout(found);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedLayoutType === 'navbar' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Navigation Bar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLayoutType('footer');
                    const found = layouts.find((l: any) => l.type === 'footer');
                    if (found) setCurrentLayout(found);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedLayoutType === 'footer' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Footer Layout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLayoutType('topbar');
                    const found = layouts.find((l: any) => l.type === 'topbar');
                    if (found) setCurrentLayout(found);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedLayoutType === 'topbar' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Top Announcement Bar
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveLayout}
                disabled={layoutSaving}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30"
              >
                {layoutSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : layoutSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{layoutSaved ? 'Saved' : 'Save Layout'}</span>
              </button>
            </div>

            {/* Layout Editor Fields */}
            <div className="bg-[#101522] border border-white/10 rounded-3xl p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Layout Title</label>
                  <input
                    type="text"
                    value={currentLayout.title || ''}
                    onChange={(e) => setCurrentLayout({ ...currentLayout, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Template Style Variant</label>
                  <select
                    value={currentLayout.templateVariant || 'default'}
                    onChange={(e) => setCurrentLayout({ ...currentLayout, templateVariant: e.target.value })}
                    className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="logo_left">Logo Left / Menu Right (Enterprise Standard)</option>
                    <option value="center_logo">Center Logo (Symmetric Luxury)</option>
                    <option value="transparent">Transparent Glassmorphism Header</option>
                    <option value="sticky">Sticky Pinned Header</option>
                    <option value="multicolumn">Multi-Column Layout (Footers)</option>
                    <option value="minimal">Minimal Compact Layout</option>
                  </select>
                </div>
              </div>

              {/* Menu Items Tree (For Navbar) */}
              {selectedLayoutType === 'navbar' && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Navigation Menu Tree</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const items = currentLayout.content?.menuItems || [];
                        const newItem = {
                          id: `m-${Date.now()}`,
                          label: 'New Link',
                          url: '/properties',
                          target: '_self',
                        };
                        setCurrentLayout({
                          ...currentLayout,
                          content: { ...currentLayout.content, menuItems: [...items, newItem] },
                        });
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Menu Link</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentLayout.content?.menuItems?.map((item: any, idx: number) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                          <span className="text-xs font-mono text-slate-500">{idx + 1}</span>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const updated = currentLayout.content.menuItems.map((m: any) =>
                                m.id === item.id ? { ...m, label: e.target.value } : m
                              );
                              setCurrentLayout({
                                ...currentLayout,
                                content: { ...currentLayout.content, menuItems: updated },
                              });
                            }}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => {
                              const updated = currentLayout.content.menuItems.map((m: any) =>
                                m.id === item.id ? { ...m, url: e.target.value } : m
                              );
                              setCurrentLayout({
                                ...currentLayout,
                                content: { ...currentLayout.content, menuItems: updated },
                              });
                            }}
                            className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 flex-1"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <IconPicker
                            value={item.icon}
                            onChange={(newIcon) => {
                              const updated = currentLayout.content.menuItems.map((m: any) =>
                                m.id === item.id ? { ...m, icon: newIcon } : m
                              );
                              setCurrentLayout({
                                ...currentLayout,
                                content: { ...currentLayout.content, menuItems: updated },
                              });
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = currentLayout.content.menuItems.filter((m: any) => m.id !== item.id);
                              setCurrentLayout({
                                ...currentLayout,
                                content: { ...currentLayout.content, menuItems: updated },
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400"
                            title="Remove Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 4: BRAND & DESIGN TOKENS */}
        {/* ============================================================ */}
        {activeTab === 'design' && theme && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between p-4 bg-[#101522] border border-white/10 rounded-2xl">
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Brand Identity &amp; Global Tokens</h2>
                <p className="text-xs text-slate-400">Manage logos, brand phone/email, colors, typography, and border radius.</p>
              </div>

              <button
                type="button"
                onClick={handleSaveTheme}
                disabled={themeSaving}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30"
              >
                {themeSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : themeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{themeSaved ? 'Saved Tokens' : 'Save Design Tokens'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brand & Logo Settings */}
              <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4 text-xs">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Brokerage Brand &amp; Logos</span>
                </h3>

                <div>
                  <label className="block text-slate-400 mb-1">Company Title</label>
                  <input
                    type="text"
                    value={theme.brand?.companyName || ''}
                    onChange={(e) => setTheme({ ...theme, brand: { ...theme.brand, companyName: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={theme.brand?.tagline || ''}
                    onChange={(e) => setTheme({ ...theme, brand: { ...theme.brand, tagline: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Primary Logo Image URL</label>
                  <input
                    type="text"
                    value={theme.brand?.logoPrimary || ''}
                    onChange={(e) => setTheme({ ...theme, brand: { ...theme.brand, logoPrimary: e.target.value } })}
                    placeholder="/images/logo.svg or CDN URL..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Hotline Phone</label>
                    <input
                      type="text"
                      value={theme.brand?.phone || ''}
                      onChange={(e) => setTheme({ ...theme, brand: { ...theme.brand, phone: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Email</label>
                    <input
                      type="text"
                      value={theme.brand?.email || ''}
                      onChange={(e) => setTheme({ ...theme, brand: { ...theme.brand, email: e.target.value } })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Color & Typography Tokens */}
              <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4 text-xs">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>Color &amp; Typography Tokens</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Primary Accent</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={theme.colors?.primary || '#3b82f6'}
                        onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, primary: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                      />
                      <span className="font-mono text-slate-300">{theme.colors?.primary || '#3b82f6'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Secondary Accent</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={theme.colors?.secondary || '#6366f1'}
                        onChange={(e) => setTheme({ ...theme, colors: { ...theme.colors, secondary: e.target.value } })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                      />
                      <span className="font-mono text-slate-300">{theme.colors?.secondary || '#6366f1'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Heading Font Family</label>
                  <input
                    type="text"
                    value={theme.fonts?.headingFont || 'Inter, sans-serif'}
                    onChange={(e) => setTheme({ ...theme, fonts: { ...theme.fonts, headingFont: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Body Font Family</label>
                  <input
                    type="text"
                    value={theme.fonts?.bodyFont || 'Inter, sans-serif'}
                    onChange={(e) => setTheme({ ...theme, fonts: { ...theme.fonts, bodyFont: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Border Radius Scale</label>
                  <input
                    type="text"
                    value={theme.scales?.borderRadius || '0.75rem'}
                    onChange={(e) => setTheme({ ...theme, scales: { ...theme.scales, borderRadius: e.target.value } })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 5: MEDIA & ASSET LIBRARY */}
        {/* ============================================================ */}
        {activeTab === 'media' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#101522] border border-white/10 rounded-2xl">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>

              {/* Add asset form */}
              <form onSubmit={handleAddAsset} className="flex items-center space-x-2 flex-1 max-w-md">
                <input
                  type="text"
                  required
                  value={newAssetUrl}
                  onChange={(e) => setNewAssetUrl(e.target.value)}
                  placeholder="Paste Image / Video URL..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  Add Asset
                </button>
              </form>
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {assets.map((asset: any) => (
                <div
                  key={asset._id}
                  className="p-3 bg-[#101522] border border-white/10 rounded-2xl space-y-2 group hover:border-white/20 transition-all"
                >
                  <div className="h-32 bg-black/40 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {asset.fileType === 'image' ? (
                      <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-8 h-8 text-blue-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{asset.title}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="uppercase">{asset.fileType}</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(asset.url)}
                      className="p-1 hover:text-blue-400"
                      title="Copy Asset URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 6: VARIABLES & MODEL DISCOVERY */}
        {/* ============================================================ */}
        {activeTab === 'variables' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#101522] border border-white/10 rounded-2xl">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={varSearch}
                  onChange={(e) => setVarSearch(e.target.value)}
                  placeholder="Search variables (e.g. property.price)..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>

              <span className="text-xs text-slate-400">{variables.length} Dynamic Variables Discovered</span>
            </div>

            {/* Variable Table */}
            <div className="bg-[#101522] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="p-3">Variable Binding</th>
                      <th className="p-3">Label</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {variables
                      .filter((v: any) => v.key.toLowerCase().includes(varSearch.toLowerCase()))
                      .map((v: any, i: number) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-400">&#123;&#123;{v.key}&#125;&#125;</td>
                          <td className="p-3 font-semibold text-white">{v.label}</td>
                          <td className="p-3 text-slate-400">{v.category}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] bg-white/5 rounded-full uppercase font-mono text-slate-300">
                              {v.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs truncate">{String(v.sampleValue)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODULE 7: INTEGRITY & BROKEN REFERENCE CHECKER */}
        {/* ============================================================ */}
        {activeTab === 'integrity' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-6 bg-[#101522] border border-white/10 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">System Integrity &amp; Broken Link Scanner</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scans all CMS pages, layouts, menu links, templates, and dynamic variable tokens for missing or broken references.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunIntegrityCheck}
                  disabled={scanningIntegrity}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
                >
                  {scanningIntegrity ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{scanningIntegrity ? 'Scanning...' : 'Run Integrity Scan'}</span>
                </button>
              </div>

              {integrityReport && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-3 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
                    {integrityReport.totalIssues === 0 ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {integrityReport.totalIssues === 0
                          ? 'All Reference Checks Passed'
                          : `${integrityReport.totalIssues} Potential Integrity Issues Found`}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {integrityReport.totalIssues === 0
                          ? 'Zero broken menu links, unmapped variables, or missing layout references detected.'
                          : 'Review the list below and take suggested remediation steps.'}
                      </p>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="space-y-2">
                    {integrityReport.issues?.map((issue: any) => (
                      <div
                        key={issue.id}
                        className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300">{issue.location}</span>
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded uppercase font-semibold">
                            {issue.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{issue.message}</p>
                        <p className="text-[11px] text-blue-400 font-medium">{issue.suggestedAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Draggable Model Sync Variable Modal */}
      <DraggableVariableModal
        isOpen={variableModalOpen}
        onClose={() => setVariableModalOpen(false)}
        onInsertVariable={(varText) => {
          navigator.clipboard.writeText(varText);
        }}
      />
    </div>
  );
}
