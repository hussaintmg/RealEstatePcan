'use client';

import React, { useState } from 'react';
import { ANIMATION_REGISTRY, AnimationDefinition } from '@/lib/cms/design/animations';
import { HOVER_EFFECT_REGISTRY, HoverEffectDefinition } from '@/lib/cms/design/hoverEffects';
import { Sparkles, Play, Check, RotateCcw, Shield } from 'lucide-react';

export default function AnimationsDesignPage() {
  const [activeTab, setActiveTab] = useState<'animations' | 'hover'>('animations');
  const [replayKey, setReplayKey] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleReplay = (key: string) => {
    setReplayKey(null);
    setTimeout(() => setReplayKey(key), 50);
  };

  const handleToggleReducedMotion = async () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    try {
      await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animations: { enableReducedMotion: nextVal },
        }),
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Animation & Hover Effect Registries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Declarative animations across CSS, Framer Motion, and GSAP/ScrollTrigger + 25 interactive hover effects.
          </p>
        </div>

        <button
          onClick={handleToggleReducedMotion}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-colors ${
            reducedMotion
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Reduced Motion: {reducedMotion ? 'Forced ON' : 'System Default'}
        </button>
      </div>

      {savedMessage && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
          <Check className="w-4 h-4" />
          Animation preference updated
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('animations')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'animations'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Animation Registry (25 Presets)
        </button>
        <button
          onClick={() => setActiveTab('hover')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'hover'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Hover Effects (25 Presets)
        </button>
      </div>

      {/* Animations Tab */}
      {activeTab === 'animations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ANIMATION_REGISTRY.map((anim) => (
            <div
              key={anim.key}
              className="rounded-xl p-5 border bg-slate-900/50 border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{anim.name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                    {anim.engine}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{anim.description}</p>

                {/* Animation Stage Preview Box */}
                <div className="h-24 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
                  <div
                    key={replayKey === anim.key ? Date.now() : anim.key}
                    className={`px-4 py-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold ${
                      replayKey === anim.key ? 'animate-bounce' : ''
                    }`}
                  >
                    Sample Property Node
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Category: {anim.category}</span>
                  <span>Duration: {anim.durationMs}ms</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => handleReplay(anim.key)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Replay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hover Tab */}
      {activeTab === 'hover' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOVER_EFFECT_REGISTRY.map((hov) => (
            <div
              key={hov.key}
              className="rounded-xl p-5 border bg-slate-900/50 border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{hov.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {hov.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{hov.description}</p>

                {/* Hover Stage Box */}
                <div className="h-24 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-4">
                  <div
                    className={`cursor-pointer px-5 py-2.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold ${hov.cssClass}`}
                  >
                    Hover Over Me
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>GPU Accelerated: {hov.hardwareAccelerated ? 'Yes' : 'No'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
