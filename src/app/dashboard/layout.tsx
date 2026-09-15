'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileDrawer } from '@/components/dashboard/MobileDrawer';
import { Topbar } from '@/components/dashboard/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import { SkeletonSidebar, SkeletonTable } from '@/components/ui/Skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Restore sidebar collapse preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dashboard_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // ignore in restricted envs
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dashboard_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Clean skeleton shell during initial authentication bootstrap
  if (loading) {
    return (
      <div className="flex h-[100dvh] max-h-[100dvh] bg-[#0a0d14] text-slate-100 overflow-hidden">
        <SkeletonSidebar className="hidden md:flex flex-shrink-0" />
        <div className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
          <div className="h-16 border-b border-white/10 bg-[#070a0f] flex items-center px-6" />
          <div className="flex-1 p-6 overflow-y-auto">
            <SkeletonTable rows={5} columns={4} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] bg-[#0a0d14] text-slate-100 overflow-hidden">
        {/* Desktop Fixed Viewport-Bound Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Mobile Slide-Out Drawer Navigation */}
        <MobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0 h-[100dvh] max-h-[100dvh] overflow-hidden">
          {/* Topbar with slots for search, notifications, profile menu */}
          <Topbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

          {/* Independently Scrollable Page Content Container */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-white/10">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
