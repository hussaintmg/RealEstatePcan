'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Palette,
  Type,
  Layout,
  LayoutGrid,
  Square,
  FileText,
  Activity,
  Sparkles,
  Lock,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const CMS_NAV_GROUPS: NavGroup[] = [
  {
    group: 'Pages & Visual Studio',
    items: [
      { label: 'Public Page Manager', href: '/dashboard/website/cms/pages', icon: Globe },
      { label: 'Section Studio', href: '/dashboard/website/cms/components/studio', icon: Sparkles },
    ],
  },
  {
    group: 'Design Foundation',
    items: [
      { label: 'Overview', href: '/dashboard/website/cms', icon: Layout },
      { label: 'Theme Families (25)', href: '/dashboard/website/cms/themes', icon: Palette },
      { label: 'Typography Engine', href: '/dashboard/website/cms/typography', icon: Type },
    ],
  },
  {
    group: 'Layout Builders',
    items: [
      { label: 'Public Design (Top/Foot)', href: '/dashboard/website/cms/public-design', icon: LayoutGrid },
      { label: 'Dashboard Layouts', href: '/dashboard/website/cms/dashboard-design', icon: Layout },
    ],
  },
  {
    group: 'Component Styling',
    items: [
      { label: 'Component Styles', href: '/dashboard/website/cms/components', icon: Square },
      { label: 'Form Layouts', href: '/dashboard/website/cms/forms', icon: FileText },
      { label: 'Auth Templates', href: '/dashboard/website/cms/auth-templates', icon: Lock },
    ],
  },
  {
    group: 'Motion & States',
    items: [
      { label: 'Skeleton Registry', href: '/dashboard/website/cms/skeletons', icon: Activity },
      { label: 'Animations & Hover', href: '/dashboard/website/cms/animations', icon: Sparkles },
      { label: 'Live Preview', href: '/dashboard/website/cms/preview', icon: Eye },
    ],
  },
];

export default function CmsWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // If in Visual Page Builder (/builder), bypass the CMS sidebar so the builder has 100% full screen canvas
  if (pathname.includes('/builder')) {
    return (
      <div className="w-full h-full min-h-[100dvh] overflow-hidden bg-[#0a0d14] text-slate-100">
        {children}
      </div>
    );
  }

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMessage(null);
    try {
      const res = await fetch('/api/cms/design/publish', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish');
      setPublishMessage({ text: `Published version ${data.version} successfully!`, type: 'success' });
      setTimeout(() => setPublishMessage(null), 4000);
    } catch (err: any) {
      setPublishMessage({ text: err.message, type: 'error' });
      setTimeout(() => setPublishMessage(null), 5000);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Single Dedicated CMS Workspace Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-xl flex-col shrink-0 h-full">
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">CMS Studio</div>
              <div className="text-sm font-bold text-slate-200">Design System</div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard link */}
        <div className="px-3 pt-3 pb-1 border-b border-slate-800/60">
          <Link
            href="/dashboard"
            className="group flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60 hover:border-amber-500/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Main Dashboard</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 group-hover:text-amber-300 group-hover:bg-amber-500/10">
              Exit Studio
            </span>
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {CMS_NAV_GROUPS.map((grp) => (
            <div key={grp.group}>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Atomic Publish Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/95">
          {publishMessage && (
            <div
              className={`mb-2 p-2 rounded-md text-xs flex items-center gap-1.5 ${
                publishMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {publishMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{publishMessage.text}</span>
            </div>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {publishing ? 'Publishing...' : 'Publish to Live Site'}
          </button>
        </div>
      </aside>

      {/* Primary Workspace Content Viewport */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6 sm:p-8 scrollbar-thin scrollbar-thumb-white/10">
        {children}
      </main>
    </div>
  );
}
