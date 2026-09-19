'use client';

import React, { useState } from 'react';
import { DEFAULT_COMPONENT_STYLES } from '@/lib/cms/design/components';
import { Square, Check, Layers } from 'lucide-react';

export default function ComponentsDesignPage() {
  const [styles, setStyles] = useState(DEFAULT_COMPONENT_STYLES);
  const [selectedRadius, setSelectedRadius] = useState('0.5rem');
  const [savedMessage, setSavedMessage] = useState(false);

  const radiusOptions = [
    { label: 'Sharp (0px)', value: '0px' },
    { label: 'Subtle (4px)', value: '0.25rem' },
    { label: 'Standard (8px)', value: '0.5rem' },
    { label: 'Rounded (12px)', value: '0.75rem' },
    { label: 'Pill (Full)', value: '9999px' },
  ];

  const handleSaveRadius = async (val: string) => {
    setSelectedRadius(val);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentStyles: { buttonRadius: val },
          themeOverrides: { metrics: { radiusMd: val } },
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Square className="w-5 h-5 text-amber-400" />
            Component Design System Presets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global component styling rules for Buttons, Cards, Inputs, and Badges.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Component presets saved
          </div>
        )}
      </div>

      {/* Button Corner Radius Controller */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Global Button Corner Radius</h3>
        <div className="flex flex-wrap gap-2.5">
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSaveRadius(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedRadius === opt.value
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Button Style Variants Preview */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Button Variants Preview</h3>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            style={{ borderRadius: selectedRadius }}
            className="px-5 py-2.5 text-xs font-semibold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            Primary Action
          </button>
          <button
            style={{ borderRadius: selectedRadius }}
            className="px-5 py-2.5 text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all active:scale-95"
          >
            Secondary
          </button>
          <button
            style={{ borderRadius: selectedRadius }}
            className="px-5 py-2.5 text-xs font-semibold border border-amber-400/60 text-amber-300 hover:bg-amber-500/10 transition-all active:scale-95"
          >
            Outline Gold
          </button>
          <button
            style={{ borderRadius: selectedRadius }}
            className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800/80 transition-all"
          >
            Ghost Neutral
          </button>
          <button
            style={{ borderRadius: selectedRadius }}
            className="px-5 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            Danger Void
          </button>
          <button
            style={{ borderRadius: '9999px' }}
            className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:scale-105 transition-all"
          >
            VIP Luxury CTA ✨
          </button>
        </div>
      </div>

      {/* Card Variants Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Card Styles (5 Architectural Presets)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-slate-300">Bordered Clean</span>
            <p className="text-xs text-slate-400">1px hairline border with solid surface background.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/60 space-y-2">
            <span className="text-xs font-bold text-slate-300">Elevated Shadow</span>
            <p className="text-xs text-slate-400">Deep dramatic drop shadow for floating modal cards.</p>
          </div>
          <div className="p-5 rounded-xl bg-slate-900/40 backdrop-blur-xl border border-amber-500/30 shadow-lg shadow-amber-500/5 space-y-2">
            <span className="text-xs font-bold text-amber-300">Frosted Glass</span>
            <p className="text-xs text-slate-400">Translucent frosted glass with gold border highlight.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
