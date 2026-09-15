'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: typeof CheckCircle2; bg: string; text: string; border: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-[#0e1f18]',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-[#261014]',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#261e0e]',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  info: {
    icon: Info,
    bg: 'bg-[#0e1a26]',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toast.durationMs ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => addToast({ type: 'success', title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ type: 'error', title, description }), [addToast]);
  const warning = useCallback((title: string, description?: string) => addToast({ type: 'warning', title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ type: 'info', title, description }), [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[80] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((item) => {
          const cfg = toastConfig[item.type];
          const Icon = cfg.icon;

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 fade-in duration-200 ${cfg.bg} ${cfg.border}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.text}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white tracking-tight">
                  {item.title}
                </div>
                {item.description && (
                  <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {item.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
