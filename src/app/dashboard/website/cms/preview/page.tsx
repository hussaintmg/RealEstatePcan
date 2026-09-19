'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

export default function CmsLivePreviewPage() {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setConfig(data.config);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Preview Control Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="font-semibold text-amber-400">Live Draft Preview:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
            Theme: {config?.activeThemeKey || 'luxury-dark'}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
            Topbar: {config?.publicLayouts?.topbarKey || 'minimal'}
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
              viewport === 'desktop' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Desktop Viewport (1440px)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
              viewport === 'tablet' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tablet Viewport (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded text-xs flex items-center gap-1.5 transition-colors ${
              viewport === 'mobile' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mobile Viewport (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfig}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reload Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 text-xs"
            title="Open Live Public Site in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Site</span>
          </a>
        </div>
      </div>

      {/* Simulated Device Frame */}
      <div className="flex-1 flex justify-center items-start overflow-auto p-4 bg-slate-950/90 rounded-xl border border-slate-800/80">
        <div
          style={{ width: viewportWidths[viewport] }}
          className="transition-all duration-300 ease-out bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col"
        >
          {/* Simulated Topbar */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Aura Heights
              </span>
            </div>

            {viewport !== 'mobile' ? (
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span>Residences</span>
                <span>Virtual Tours</span>
                <span>Advisory</span>
                <span className="px-3 py-1 rounded bg-amber-400 text-slate-950 font-semibold text-[11px]">
                  VIP Viewing
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 px-2 py-1 rounded border border-slate-800">
                ☰
              </div>
            )}
          </div>

          {/* Simulated Hero Section */}
          <div className="p-8 sm:p-12 text-center space-y-4 bg-gradient-to-b from-slate-950 to-slate-900 flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mx-auto">
              <Sparkles className="w-3 h-3" />
              Active Theme: {config?.activeThemeKey || 'luxury-dark'}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-100 tracking-tight">
              Architectural Living Spaces in Islamabad
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Explore luxury penthouses, signature villas, and interactive PlayCanvas 3D walkthroughs with live unit availability.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                Explore in 3D
              </button>
              <button className="px-5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                View Gallery
              </button>
            </div>
          </div>

          {/* Simulated Footer */}
          <div className="p-6 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Aura Heights. Powered by PlayCanvas 3D Engine & Next.js.
          </div>
        </div>
      </div>
    </div>
  );
}
