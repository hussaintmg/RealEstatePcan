'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  Bell,
  Sliders,
  ShieldAlert,
  HelpCircle,
  LogOut,
  ChevronDown,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';

export interface TopbarProps {
  onOpenMobileMenu: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  className = '',
}) => {
  const { user, branding, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <header
      className={`h-16 border-b border-white/10 bg-[#070a0f]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 z-30 sticky top-0 flex-shrink-0 ${className}`}
    >
      {/* Left Section: Mobile Hamburger & Current Workspace Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <span className="text-xs font-semibold text-white truncate sm:text-sm">
            {branding.websiteName}
          </span>
          <span className="hidden sm:inline-block text-slate-600">/</span>
          <span className="hidden sm:inline-block text-xs text-slate-400 truncate">
            {user.isDeveloper
              ? 'Developer Master Console'
              : user.isOwner
              ? 'Executive Control Room'
              : 'Workspace Operations'}
          </span>
        </div>
      </div>

      {/* Right Section: Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Search Input (Desktop) */}
        <div className="hidden lg:block w-64">
          <SearchInput
            size="sm"
            value={searchQuery}
            onValueChange={setSearchQuery}
            placeholder="Quick search workspace..."
            shortcutBadge="⌘K"
          />
        </div>

        {/* Notifications Button */}
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#070a0f]" />
        </button>

        {/* Profile Menu Popover */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                {user.isDeveloper ? 'Developer' : user.isOwner ? 'Owner' : 'Staff'}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0f1422] border border-white/15 shadow-2xl p-2 z-[40] animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User Header */}
              <div className="px-3 py-2.5 border-b border-white/10 mb-1 space-y-1">
                <div className="text-xs font-bold text-white truncate">
                  {user.fullName}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </div>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {user.isDeveloper ? 'Super Admin / Developer' : user.isOwner ? 'Primary Owner' : 'Team Member'}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-0.5 text-xs">
                {user.isDeveloper && (
                  <Link
                    href="/dashboard/developer"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Developer Console</span>
                  </Link>
                )}

                {(user.isOwner || user.isDeveloper) && (
                  <Link
                    href="/dashboard/owner/audit-feed"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Real-Time Audit Stream</span>
                  </Link>
                )}

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Public Website</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </Link>
              </div>

              {/* Divider & Sign Out */}
              <div className="border-t border-white/10 mt-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    {loggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                    ) : (
                      <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                    )}
                    <span>Sign Out</span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-rose-400">
                    ESC to close
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
