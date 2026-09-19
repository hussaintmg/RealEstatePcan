'use client';

import React, { useEffect, useState } from 'react';
import { CURATED_FONT_PAIRINGS, calculateFluidTypeScale } from '@/lib/cms/design/typography';
import { FONT_REGISTRY } from '@/lib/cms/design/fonts';
import { Type, Check, Sliders, Sparkles } from 'lucide-react';

export default function TypographyPage() {
  const [activePairingId, setActivePairingId] = useState('luxury-editorial');
  const [fluidFactor, setFluidFactor] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.typography) {
          if (data.config.typography.pairingId) setActivePairingId(data.config.typography.pairingId);
          if (data.config.typography.fluidScaleFactor) setFluidFactor(data.config.typography.fluidScaleFactor);
        }
      })
      .catch(console.error);
  }, []);

  const fluidScale = calculateFluidTypeScale(fluidFactor);

  const handleSelectPairing = async (pair: (typeof CURATED_FONT_PAIRINGS)[0]) => {
    setActivePairingId(pair.id);
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typography: {
            pairingId: pair.id,
            headingFont: pair.headingFont,
            bodyFont: pair.bodyFont,
            uiFont: pair.uiFont,
            fluidScaleFactor: fluidFactor,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save pairing:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleScaleFactorChange = async (newVal: number) => {
    setFluidFactor(newVal);
    try {
      await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typography: { fluidScaleFactor: newVal },
        }),
      });
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
            <Type className="w-5 h-5 text-amber-400" />
            Typography Engine & Fluid Scaling
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Curated architectural font pairings, fluid clamp() scales, and selective Google Fonts injection.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Typography updated
          </div>
        )}
      </div>

      {/* Fluid Scale Slider */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Responsive Fluid Clamp Scaling Factor
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Smoothly scales headings between mobile (375px) and desktop (1440px) viewports using CSS clamp().
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-amber-300">
            {fluidFactor.toFixed(2)}x
          </span>
        </div>

        <input
          type="range"
          min="0.8"
          max="1.3"
          step="0.05"
          value={fluidFactor}
          onChange={(e) => handleScaleFactorChange(parseFloat(e.target.value))}
          className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />

        {/* Live Scale Previews */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500">Display Title</div>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">{fluidScale.display}</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500">H1 Headline</div>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">{fluidScale.h1}</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500">H2 Subheading</div>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">{fluidScale.h2}</div>
          </div>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-mono text-slate-500">Body Paragraph</div>
            <div className="text-xs font-mono text-slate-300 mt-1 truncate">{fluidScale.body}</div>
          </div>
        </div>
      </div>

      {/* Curated Font Pairings */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Curated Architectural Pairings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CURATED_FONT_PAIRINGS.map((pair) => {
            const isSelected = activePairingId === pair.id;
            return (
              <div
                key={pair.id}
                onClick={() => handleSelectPairing(pair)}
                className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-200">{pair.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {pair.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4">{pair.description}</p>

                  {/* Visual Type Sample */}
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 mb-3">
                    <div
                      className="text-lg font-bold text-slate-100 leading-tight"
                      style={{ fontFamily: pair.headingFont }}
                    >
                      Aura Margalla Towers
                    </div>
                    <div
                      className="text-xs text-slate-300 leading-relaxed"
                      style={{ fontFamily: pair.bodyFont }}
                    >
                      Refined panoramic penthouses overlooking the capital hills with private infinity pools.
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 space-y-1">
                    <div>Heading: <span className="text-slate-300">{pair.headingFont}</span></div>
                    <div>Body: <span className="text-slate-300">{pair.bodyFont}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Pairing' : 'Apply Pairing'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
