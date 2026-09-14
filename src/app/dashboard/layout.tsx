'use client';

import React, { useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import {
  Building2,
  Sliders,
  ShieldAlert,
  Home,
  Users,
  UserCheck,
  FileText,
  FileCode,
  Layout,
  Activity,
  LogOut,
  User,
  Compass,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { isAllowed } = useFeatureFlags();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center text-slate-400 text-xs">
        Loading secure workspace...
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    // Developer Exclusive
    ...(user.isDeveloper
      ? [
          {
            label: 'Developer Master Console',
            href: '/dashboard/developer',
            icon: Sliders,
            badge: 'MASTER',
          },
          ...(isAllowed('cms')
            ? [
                {
                  label: 'Custom CMS Studio',
                  href: '/dashboard/cms',
                  icon: Layout,
                },
              ]
            : []),
          ...(isAllowed('templateEditors')
            ? [
                {
                  label: 'Template Suite (PDF/Email)',
                  href: '/dashboard/templates',
                  icon: FileCode,
                },
              ]
            : []),
        ]
      : []),

    // Owner / Staff Operational Pages
    ...(user.isOwner || user.isDeveloper
      ? [
          {
            label: 'Owner Overview',
            href: '/dashboard/owner',
            icon: Activity,
          },
          ...(isAllowed('realtimeAuditLogs')
            ? [
                {
                  label: 'Real-Time Audit Stream',
                  href: '/dashboard/owner/audit-feed',
                  icon: ShieldAlert,
                  live: true,
                },
              ]
            : []),
        ]
      : []),

    {
      label: 'Properties & 3D Models',
      href: '/dashboard/properties',
      icon: Home,
    },
    {
      label: 'Leads & Conversions',
      href: '/dashboard/leads',
      icon: Users,
    },
    {
      label: 'Converted Customers',
      href: '/dashboard/customers',
      icon: UserCheck,
    },
    {
      label: 'Invoices & Milestones',
      href: '/dashboard/invoices',
      icon: FileText,
    },

    ...(user.isOwner || user.isDeveloper
      ? [
          {
            label: 'RBAC Roles & Scoping',
            href: '/dashboard/roles',
            icon: User,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#070a0f] border-r border-white/10 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">
                AURA<span className="text-blue-500">HEIGHTS</span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                {user.isDeveloper
                  ? 'Developer Console'
                  : user.isOwner
                  ? 'Owner Control Room'
                  : 'Operations Desk'}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}

                  {item.live && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="font-semibold text-white truncate">{user.fullName}</div>
              <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-medium transition-colors border border-transparent hover:border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
