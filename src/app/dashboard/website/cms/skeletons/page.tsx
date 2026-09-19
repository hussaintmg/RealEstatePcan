'use client';

import React, { useEffect, useState } from 'react';
import { SKELETON_TEMPLATES, SkeletonTemplate } from '@/lib/cms/design/skeletons';
import { Activity, Check, Play, RefreshCw } from 'lucide-react';

export default function SkeletonsDesignPage() {
  const [activePattern, setActivePattern] = useState('skel-property-card');
  const [activeAnim, setActiveAnim] = useState<'pulse' | 'shimmer' | 'wave' | 'static'>('shimmer');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.skeletons) {
          if (data.config.skeletons.activePattern) setActivePattern(data.config.skeletons.activePattern);
          if (data.config.skeletons.animation) setActiveAnim(data.config.skeletons.animation);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = async (patternKey: string, anim: 'pulse' | 'shimmer' | 'wave' | 'static') => {
    setActivePattern(patternKey);
    setActiveAnim(anim);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skeletons: { activePattern: patternKey, animation: anim },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-amber-400" />
            Content-Accurate Skeleton Registry (25 Patterns)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure loading state placeholders. Skeletons mirror real layout dimensions and only display during active loading.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Skeleton configuration saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SKELETON_TEMPLATES.map((skel) => {
          const isSelected = activePattern === skel.key;
          return (
            <div
              key={skel.key}
              onClick={() => handleSelect(skel.key, skel.animation)}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{skel.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {skel.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{skel.description}</p>

                {/* Animated Placeholder Silhouette */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2.5 mb-3">
                  <div
                    className={`w-full h-24 rounded-lg ${
                      skel.animation === 'pulse'
                        ? 'animate-pulse bg-slate-800'
                        : skel.animation === 'shimmer'
                        ? 'animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800'
                        : 'bg-slate-800'
                    }`}
                  />
                  <div className="w-3/4 h-3 rounded bg-slate-800 animate-pulse" />
                  <div className="w-1/2 h-2.5 rounded bg-slate-800 animate-pulse" />
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Animation: {skel.animation}</span>
                  <span>Duration: {skel.speedMs}ms</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Pattern' : 'Select Pattern'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
