'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileDrawer } from '@/components/dashboard/MobileDrawer';
import { Topbar } from '@/components/dashboard/Topbar';
import { ToastProvider } from '@/components/ui/Toast';
import { SkeletonSidebar, SkeletonTable } from '@/components/ui/Skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Determine route safely using window.location when mounted, or usePathname fallback
  const currentPath = (mounted && typeof window !== 'undefined' ? window.location.pathname : pathname) || '';

  // Sub-workspace route classification:
  // 1. Page Builder (/builder): Full-screen canvas workspace (no outer dashboard sidebar, no outer topbar)
  const isPageBuilder = currentPath.includes('/builder') || pathname.includes('/builder');

  // 2. 3D Spatial Studio (/dashboard/properties/[id]/3d): Dedicated 3D studio (no outer dashboard sidebar, no outer topbar)
  const is3DStudio = currentPath.includes('/3d') || pathname.includes('/3d');

  // 3. CMS Studio (/dashboard/website, /dashboard/cms, etc.): Dedicated sub-workspace with its own sidebar
  // Hide main dashboard sidebar so ONLY ONE sidebar (CMS sidebar) is shown to the user
  const isCmsWorkspace =
    currentPath.startsWith('/dashboard/website') ||
    currentPath.startsWith('/dashboard/cms') ||
    currentPath.includes('/cms') ||
    pathname.startsWith('/dashboard/website') ||
    pathname.startsWith('/dashboard/cms') ||
    pathname.includes('/cms');

  // Should we show the outer dashboard sidebar?
  // Only on standard dashboard routes - never in CMS sub-workspace, Page Builder, or 3D Studio
  const isDedicatedWorkspace = isCmsWorkspace || isPageBuilder || is3DStudio;
  const showDashboardSidebar = mounted
    ? !isDedicatedWorkspace
    : (!pathname.includes('/cms') && !pathname.includes('/website') && !pathname.includes('/builder') && !pathname.includes('/3d') && pathname !== '');

  // Full-screen studios provide their own topbars/controls
  const showTopbar = !isPageBuilder && !is3DStudio;

  return (
    <ToastProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] bg-[#0a0d14] text-slate-100 overflow-hidden">
        {/* Render Dashboard Sidebar ONLY on standard dashboard routes - never in CMS sub-workspace, builder, or 3D studio */}
        {showDashboardSidebar && (
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        )}

        {/* Mobile Slide-Out Drawer Navigation */}
        {showTopbar && (
          <MobileDrawer
            isOpen={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            isCmsWorkspace={isCmsWorkspace}
          />
        )}

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0 h-[100dvh] max-h-[100dvh] overflow-hidden">
          {/* Topbar: shown on standard dashboard routes and CMS pages, hidden in full-screen Page Builder & 3D Studio */}
          {showTopbar && (
            <Topbar onOpenMobileMenu={() => setMobileDrawerOpen(true)} />
          )}

          {/* Page Content Container: full width/height for CMS/Builder/3D workspaces, padded scroll for standard pages */}
          <main
            className={`flex-1 min-w-0 ${
              isPageBuilder || is3DStudio
                ? 'p-0 overflow-hidden h-[100dvh]'
                : isCmsWorkspace
                ? 'p-0 overflow-hidden h-full'
                : 'overflow-y-auto overflow-x-auto p-3 sm:p-4 lg:p-5 custom-scrollbar'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
