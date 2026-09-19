'use client';

import React, { useEffect, useState } from 'react';
import { PUBLIC_TOPBAR_TEMPLATES } from '@/lib/cms/design/publicTopbars';
import { MOBILE_NAV_TEMPLATES } from '@/lib/cms/design/mobileNavs';
import { PUBLIC_FOOTER_TEMPLATES } from '@/lib/cms/design/publicFooters';
import { LayoutGrid, Check, Search, Shield, Sliders } from 'lucide-react';

export default function PublicDesignPage() {
  const [activeTab, setActiveTab] = useState<'topbar' | 'mobile' | 'footer'>('topbar');
  const [selectedTopbar, setSelectedTopbar] = useState('topbar-minimal-centered');
  const [selectedMobile, setSelectedMobile] = useState('mob-drawer-left');
  const [selectedFooter, setSelectedFooter] = useState('footer-large-editorial');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.publicLayouts) {
          if (data.config.publicLayouts.topbarKey) setSelectedTopbar(data.config.publicLayouts.topbarKey);
          if (data.config.publicLayouts.mobileNavKey) setSelectedMobile(data.config.publicLayouts.mobileNavKey);
          if (data.config.publicLayouts.footerKey) setSelectedFooter(data.config.publicLayouts.footerKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = async (type: 'topbar' | 'mobile' | 'footer', key: string) => {
    if (type === 'topbar') setSelectedTopbar(key);
    if (type === 'mobile') setSelectedMobile(key);
    if (type === 'footer') setSelectedFooter(key);

    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicLayouts: {
            topbarKey: type === 'topbar' ? key : selectedTopbar,
            mobileNavKey: type === 'mobile' ? key : selectedMobile,
            footerKey: type === 'footer' ? key : selectedFooter,
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
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            Public Layout Builders & Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure 25 Public Topbars, 25 Mobile Navigation drawers, and 25 Footer architectures.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Layout saved to draft
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('topbar')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'topbar'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Topbars & Navigation (25)
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'mobile'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Mobile Navigation (25)
        </button>
        <button
          onClick={() => setActiveTab('footer')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'footer'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Footers (25)
        </button>
      </div>

      {/* Topbar Tab Content */}
      {activeTab === 'topbar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PUBLIC_TOPBAR_TEMPLATES.map((tpl) => {
            const isSelected = selectedTopbar === tpl.key;
            return (
              <div
                key={tpl.key}
                onClick={() => handleSelect('topbar', tpl.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{tpl.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{tpl.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Height:</span> <span className="text-slate-200">{tpl.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Container:</span> <span className="text-slate-200">{tpl.containerWidth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sticky:</span> <span className="text-slate-200">{tpl.sticky ? 'Yes' : 'No'}</span>
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

      {/* Mobile Tab Content */}
      {activeTab === 'mobile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOBILE_NAV_TEMPLATES.map((mob) => {
            const isSelected = selectedMobile === mob.key;
            return (
              <div
                key={mob.key}
                onClick={() => handleSelect('mobile', mob.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{mob.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {mob.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{mob.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Pattern:</span> <span className="text-slate-200">{mob.pattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Animation:</span> <span className="text-slate-200">{mob.animationType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Backdrop Blur:</span> <span className="text-slate-200">{mob.blurOverlay ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Mobile' : 'Use Template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Tab Content */}
      {activeTab === 'footer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PUBLIC_FOOTER_TEMPLATES.map((ftr) => {
            const isSelected = selectedFooter === ftr.key;
            return (
              <div
                key={ftr.key}
                onClick={() => handleSelect('footer', ftr.key)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{ftr.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {ftr.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{ftr.description}</p>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Columns:</span> <span className="text-slate-200">{ftr.columnsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Newsletter:</span> <span className="text-slate-200">{ftr.showNewsletter ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Social Icons:</span> <span className="text-slate-200">{ftr.showSocialIcons ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Footer' : 'Use Template'}
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
