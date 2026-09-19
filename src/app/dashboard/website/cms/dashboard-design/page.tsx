'use client';

import React, { useEffect, useState } from 'react';
import {
  DASHBOARD_TOPBAR_TEMPLATES,
  DASHBOARD_SIDEBAR_TEMPLATES,
  DASHBOARD_SHELL_TEMPLATES,
} from '@/lib/cms/design/dashboardLayouts';
import { Layout, Check, ShieldCheck, Layers } from 'lucide-react';

export default function DashboardDesignPage() {
  const [activeTab, setActiveTab] = useState<'topbars' | 'sidebars' | 'shells'>('topbars');
  const [selectedTopbar, setSelectedTopbar] = useState('dash-topbar-command-bar');
  const [selectedSidebar, setSelectedSidebar] = useState('dash-sidebar-classic-grouped');
  const [selectedShell, setSelectedShell] = useState('shell-standard-enterprise');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.dashboardLayouts) {
          if (data.config.dashboardLayouts.topbarKey) setSelectedTopbar(data.config.dashboardLayouts.topbarKey);
          if (data.config.dashboardLayouts.sidebarKey) setSelectedSidebar(data.config.dashboardLayouts.sidebarKey);
          if (data.config.dashboardLayouts.shellKey) setSelectedShell(data.config.dashboardLayouts.shellKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = async (type: 'topbars' | 'sidebars' | 'shells', key: string) => {
    if (type === 'topbars') setSelectedTopbar(key);
    if (type === 'sidebars') setSelectedSidebar(key);
    if (type === 'shells') setSelectedShell(key);

    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardLayouts: {
            topbarKey: type === 'topbars' ? key : selectedTopbar,
            sidebarKey: type === 'sidebars' ? key : selectedSidebar,
            shellKey: type === 'shells' ? key : selectedShell,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Layout className="w-5 h-5 text-amber-400" />
            Dashboard & Portal Shell Builders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            25 Dashboard Topbars, 25 Sidebars, and specialized Portal Shells. Module 3 RBAC permissions are strictly preserved.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Dashboard layout saved to draft
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Authorization Invariance</strong>: Switching dashboard layouts controls visual appearance, densities, and container spacing only.
          User capabilities and accessible routes remain strictly governed by Module 3 RBAC rules.
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('topbars')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'topbars'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Dashboard Topbars (25)
        </button>
        <button
          onClick={() => setActiveTab('sidebars')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sidebars'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Dashboard Sidebars (25)
        </button>
        <button
          onClick={() => setActiveTab('shells')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'shells'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Shell & Portal Templates
        </button>
      </div>

      {/* Topbars Tab Content */}
      {activeTab === 'topbars' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DASHBOARD_TOPBAR_TEMPLATES.map((dt) => {
            const isSelected = selectedTopbar === dt.key;
            return (
              <div
                key={dt.key}
                onClick={() => handleSelect('topbars', dt.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{dt.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {dt.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{dt.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Quick Search:</span> <span className="text-slate-200">{dt.hasQuickSearch ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Breadcrumbs:</span> <span className="text-slate-200">{dt.hasBreadcrumbs ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audit Trigger:</span> <span className="text-slate-200">{dt.hasAuditStreamTrigger ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Topbar' : 'Use Template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sidebars Tab Content */}
      {activeTab === 'sidebars' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {DASHBOARD_SIDEBAR_TEMPLATES.map((sb) => {
            const isSelected = selectedSidebar === sb.key;
            return (
              <div
                key={sb.key}
                onClick={() => handleSelect('sidebars', sb.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{sb.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {sb.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{sb.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Width:</span> <span className="text-slate-200">{sb.width}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collapsible:</span> <span className="text-slate-200">{sb.collapsible ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role Badges:</span> <span className="text-slate-200">{sb.showRoleBadge ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Sidebar' : 'Use Template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shells Tab Content */}
      {activeTab === 'shells' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {DASHBOARD_SHELL_TEMPLATES.map((shl) => {
            const isSelected = selectedShell === shl.key;
            return (
              <div
                key={shl.key}
                onClick={() => handleSelect('shells', shl.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{shl.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {shl.shellType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{shl.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Topbar:</span> <span className="text-slate-200">{shl.topbarKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sidebar:</span> <span className="text-slate-200">{shl.sidebarKey}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content Padding:</span> <span className="text-slate-200">{shl.contentPadding}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Shell' : 'Use Shell'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
