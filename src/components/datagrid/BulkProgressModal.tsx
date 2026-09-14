'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { BulkProgress } from '@/lib/bulkWorker';

interface BulkProgressModalProps {
  isOpen: boolean;
  progress: BulkProgress | null;
  title: string;
  isComplete: boolean;
  onClose: () => void;
}

export const BulkProgressModal: React.FC<BulkProgressModalProps> = ({
  isOpen,
  progress,
  title,
  isComplete,
  onClose,
}) => {
  if (!isOpen || !progress) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#101522] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isComplete ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            )}
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          {isComplete && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-300">
            <span>{progress.currentAction}</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isComplete ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
          <div className="p-2 bg-white/[0.03] rounded-lg border border-white/5">
            <div className="text-slate-400">Total</div>
            <div className="font-semibold text-white mt-0.5">{progress.total}</div>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="text-emerald-400">Success</div>
            <div className="font-semibold text-emerald-300 mt-0.5">{progress.completed - progress.failed}</div>
          </div>
          <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <div className="text-rose-400">Failed</div>
            <div className="font-semibold text-rose-300 mt-0.5">{progress.failed}</div>
          </div>
        </div>

        {isComplete && (
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
