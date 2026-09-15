'use client';

import React, { ReactNode } from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-white/10 bg-[#0c101a]/60 backdrop-blur-sm space-y-4 my-4 ${className}`}
    >
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
        <Icon className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
};
