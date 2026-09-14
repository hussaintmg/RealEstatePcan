'use client';

import React from 'react';
import Link from 'next/link';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useAuth } from '@/context/AuthContext';
import { GlobalSearchBar } from './GlobalSearchBar';
import { Building2, User, LogIn, LayoutDashboard, Compass } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { isAllowed } = useFeatureFlags();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0a0d14]/80 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              AURA<span className="text-blue-500">HEIGHTS</span>
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest text-slate-400 uppercase font-medium">
              3D Living Spaces
            </span>
          </div>
        </Link>

        {/* Global Search Bar (Conditionally Gated by Developer) */}
        {isAllowed('globalSearch') && (
          <div className="hidden md:block flex-1 max-w-sm">
            <GlobalSearchBar />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/properties" className="hover:text-white transition-colors">
            Properties
          </Link>
          {isAllowed('playcanvas3d') && (
            <Link
              href="/#virtual-tour"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D Virtual Tours</span>
            </Link>
          )}
          <Link href="/#contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>

        {/* Auth / Portal Action */}
        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              href={user.isDeveloper ? '/dashboard/developer' : user.isOwner ? '/dashboard/owner' : user.roleId ? '/dashboard/properties' : '/portal'}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>
                {user.isDeveloper
                  ? 'Dev Console'
                  : user.isOwner
                  ? 'Owner Panel'
                  : user.roleId
                  ? 'Staff Panel'
                  : 'User Portal'}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-medium transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-400" />
              <span>Client / Staff Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
