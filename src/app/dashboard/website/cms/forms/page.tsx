'use client';

import React, { useEffect, useState } from 'react';
import { FORM_LAYOUT_TEMPLATES } from '@/lib/cms/design/forms';
import { FileText, Check } from 'lucide-react';

export default function FormsDesignPage() {
  const [activeLayout, setActiveLayout] = useState('form-stacked-standard');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.forms?.layoutKey) {
          setActiveLayout(data.config.forms.layoutKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = async (key: string) => {
    setActiveLayout(key);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forms: { layoutKey: key },
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
            <FileText className="w-5 h-5 text-amber-400" />
            Form Layout Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose structural layout presets for lead generation, consultation scheduling, and viewing request forms.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Form layout saved
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FORM_LAYOUT_TEMPLATES.map((fl) => {
          const isSelected = activeLayout === fl.key;
          return (
            <div
              key={fl.key}
              onClick={() => handleSelect(fl.key)}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{fl.name}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-4">{fl.description}</p>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Layout:</span> <span className="text-slate-200">{fl.layout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Label Placement:</span> <span className="text-slate-200">{fl.labelPlacement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submit Button:</span> <span className="text-slate-200">{fl.submitButtonWidth}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Form' : 'Use Layout'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
