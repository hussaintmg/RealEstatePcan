'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutDashboard,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  History,
  Save,
  Rocket,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

interface BuilderToolbarProps {
  pageTitle: string;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  breakpoint: Breakpoint;
  onBreakpointChange: (bp: Breakpoint) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isPreview: boolean;
  onTogglePreview: () => void;
  onOpenHistory: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  pageTitle,
  saveStatus,
  breakpoint,
  onBreakpointChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isPreview,
  onTogglePreview,
  onOpenHistory,
  onSaveDraft,
  onPublish,
  isPublishing = false,
}) => {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0d121f]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Left: Back & Title */}
      <div className="flex items-center space-x-3">
        <Link
          href="/dashboard/website/cms/pages"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          title="Return to Pages Manager"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all border border-white/10"
          title="Return to Main Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
          <span>Dashboard</span>
        </Link>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-xs">{pageTitle}</h1>
            <span className="text-[10px] text-blue-400 font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              Page Builder
            </span>
          </div>

          {/* Save Status Indicator */}
          <div className="flex items-center space-x-1.5 text-[10px] mt-0.5">
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>All changes saved</span>
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-blue-400 flex items-center space-x-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Autosaving draft...</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-amber-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved edits</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Save error</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Undo/Redo & Breakpoint Switches */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-1 bg-white/[0.02] border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-white/10 transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-white/10 transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Breakpoints */}
        <div className="flex items-center space-x-1 bg-white/[0.02] border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => onBreakpointChange('desktop')}
            title="Desktop View (1440px)"
            className={`p-1.5 rounded-lg transition-all ${
              breakpoint === 'desktop' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onBreakpointChange('tablet')}
            title="Tablet View (768px)"
            className={`p-1.5 rounded-lg transition-all ${
              breakpoint === 'tablet' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onBreakpointChange('mobile')}
            title="Mobile View (375px)"
            className={`p-1.5 rounded-lg transition-all ${
              breakpoint === 'mobile' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Preview, History, Save & Publish */}
      <div className="flex items-center space-x-2.5">
        <button
          type="button"
          onClick={onTogglePreview}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
            isPreview
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isPreview ? 'Edit Mode' : 'Preview'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          title="Version History & Rollback"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105 disabled:opacity-50"
        >
          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          <span>Publish Live</span>
        </button>
      </div>
    </header>
  );
};
