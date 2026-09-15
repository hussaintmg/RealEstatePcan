'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  icon?: any;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  actions,
  badge,
  icon,
  className = '',
}) => {
  const IconComponent = icon;
  const effectiveActions = actions || primaryAction;

  return (
    <div className={`space-y-3 pb-6 border-b border-white/10 mb-6 ${className}`}>
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-white transition-colors truncate max-w-[150px]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`${isLast ? 'text-slate-200 font-medium' : ''} truncate max-w-[150px]`}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5">
            {IconComponent && (
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <IconComponent className="w-4 h-4" />
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
              {title}
            </h1>
            {badge && <div className="flex-shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {(effectiveActions || secondaryActions) && (
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
            {secondaryActions}
            {effectiveActions}
          </div>
        )}
      </div>
    </div>
  );
};
