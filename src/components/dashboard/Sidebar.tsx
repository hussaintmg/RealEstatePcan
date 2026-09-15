'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  DASHBOARD_NAVIGATION,
  filterNavigationSections,
  isRouteActive,
} from '@/lib/navigation/registry';
import { NavigationItem, NavigationSection } from '@/lib/navigation/types';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2,
} from 'lucide-react';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = '',
}) => {
  const pathname = usePathname();
  const { user, branding, permissions, effectivePermissions, features, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const sections = filterNavigationSections(DASHBOARD_NAVIGATION, {
    isDeveloper: !!user.isDeveloper,
    isOwner: !!user.isOwner,
    permissions,
    effectivePermissions,
    features,
  });

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside
      aria-label="Dashboard Sidebar"
      className={`hidden md:flex flex-col justify-between h-[100dvh] max-h-[100dvh] bg-[#070a0f] border-r border-white/10 flex-shrink-0 transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Top: Brand Header */}
      <div className="flex flex-col flex-shrink-0">
        <div className={`p-4 border-b border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          {branding.headerLogo ? (
            <img
              src={branding.headerLogo}
              alt={branding.websiteName}
              className="h-8 w-auto object-contain rounded-lg flex-shrink-0"
            />
          ) : (
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white tracking-tight truncate">
                {branding.websiteName}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
                {user.isDeveloper
                  ? 'Developer Console'
                  : user.isOwner
                  ? 'Owner Control Room'
                  : 'Operations Desk'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Scrollable Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            {!isCollapsed ? (
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                {section.title}
              </div>
            ) : (
              <div className="h-px bg-white/10 my-2 mx-2" />
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(pathname, item.href, item.exactMatch);

                const linkContent = (
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center rounded-xl transition-all duration-150 ${
                      isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && (
                        <span className="text-xs truncate tracking-tight">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {item.badge}
                          </span>
                        )}
                        {item.live && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                    )}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip
                      key={item.id}
                      side="right"
                      content={
                        <div className="flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/30 text-amber-300">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      }
                    >
                      {linkContent}
                    </Tooltip>
                  );
                }

                return <div key={item.id}>{linkContent}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: User Card & Collapse Controls */}
      <div className="p-3 border-t border-white/10 bg-black/20 flex-shrink-0 space-y-2">
        {/* User preview */}
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs flex-shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-semibold text-white truncate">{user.fullName}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Tooltip side="right" content={`${user.fullName} (${user.email})`}>
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs cursor-default">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            </Tooltip>
          </div>
        )}

        {/* Action buttons: Collapse Toggle and Logout */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex-1 flex items-center justify-center py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px]">Collapse</span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/20 rounded-xl transition-colors border border-white/5 flex-shrink-0"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
