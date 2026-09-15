'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  DASHBOARD_NAVIGATION,
  filterNavigationSections,
  isRouteActive,
} from '@/lib/navigation/registry';
import { Drawer } from '@/components/ui/Drawer';
import { Building2, LogOut } from 'lucide-react';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, branding, permissions, effectivePermissions, features, logout } = useAuth();

  if (!user) return null;

  const sections = filterNavigationSections(DASHBOARD_NAVIGATION, {
    isDeveloper: !!user.isDeveloper,
    isOwner: !!user.isOwner,
    permissions,
    effectivePermissions,
    features,
  });

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="left"
      width="w-72 sm:w-80"
      className="bg-[#070a0f]"
    >
      <div className="flex flex-col h-full justify-between select-none">
        {/* Top: Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center space-x-3">
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
        </div>

        {/* Middle: Scrollable Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(pathname, item.href, item.exactMatch);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      prefetch={false}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-xs truncate tracking-tight">
                          {item.label}
                        </span>
                      </div>

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
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: User Card & Sign Out */}
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-semibold text-white truncate">{user.fullName}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-medium transition-colors border border-transparent hover:border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </Drawer>
  );
};
