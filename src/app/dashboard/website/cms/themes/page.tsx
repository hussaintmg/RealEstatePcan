'use client';

import React, { useEffect, useState } from 'react';
import { SYSTEM_THEMES } from '@/lib/cms/design/themes';
import { Palette, Check, Sliders, RefreshCw, Save } from 'lucide-react';

export default function ThemesPage() {
  const [activeKey, setActiveKey] = useState('luxury-dark');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.activeThemeKey) {
          setActiveKey(data.config.activeThemeKey);
        }
      })
      .catch(console.error);
  }, []);

  const categories = ['All', 'Luxury', 'Architectural', 'Editorial', 'Minimal', 'Modern', 'Warm', 'Corporate', 'High-Tech'];

  const filteredThemes = categoryFilter === 'All'
    ? SYSTEM_THEMES
    : SYSTEM_THEMES.filter((t) => t.category === categoryFilter);

  const handleSelectTheme = async (key: string) => {
    setActiveKey(key);
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeThemeKey: key }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error('Failed to select theme:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-400" />
            Theme Families Library (25 Genuinely Distinct)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Select an architectural theme family. Each theme customizes colors, surfaces, typography, borders, and shadows.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Theme draft updated
          </div>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 25 Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredThemes.map((thm) => {
          const isSelected = activeKey === thm.key;
          const colors = thm.tokens.colors;
          const typo = thm.tokens.typography;

          return (
            <div
              key={thm.key}
              onClick={() => handleSelectTheme(thm.key)}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      {thm.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {thm.category}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {thm.description}
                </p>

                {/* Color Swatches Palette */}
                <div className="space-y-1.5 mb-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Palette Swatches
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-7 h-7 rounded-md border border-slate-700 shadow-inner"
                      style={{ backgroundColor: colors.background }}
                      title={`Background: ${colors.background}`}
                    />
                    <div
                      className="w-7 h-7 rounded-md border border-slate-700 shadow-inner"
                      style={{ backgroundColor: colors.surface1 }}
                      title={`Surface: ${colors.surface1}`}
                    />
                    <div
                      className="w-7 h-7 rounded-md border border-slate-700 shadow-inner"
                      style={{ backgroundColor: colors.primary }}
                      title={`Primary: ${colors.primary}`}
                    />
                    <div
                      className="w-7 h-7 rounded-md border border-slate-700 shadow-inner"
                      style={{ backgroundColor: colors.secondary }}
                      title={`Secondary: ${colors.secondary}`}
                    />
                    <div
                      className="w-7 h-7 rounded-md border border-slate-700 shadow-inner"
                      style={{ backgroundColor: colors.accent }}
                      title={`Accent: ${colors.accent}`}
                    />
                  </div>
                </div>

                {/* Typography metadata */}
                <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                  <span className="font-mono text-slate-500">Heading:</span>
                  <span className="font-medium text-slate-300 truncate max-w-[160px]">
                    {typo.headingFont.split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Bottom selection indicator */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Mode: {thm.mode}</span>
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Theme' : 'Apply Theme'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
