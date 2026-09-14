'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { GlobalSearchBar } from './GlobalSearchBar';
import { DynamicCmsIcon } from '@/lib/cms/iconResolver';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  Compass,
  Calendar,
} from 'lucide-react';

interface DynamicNavbarProps {
  initialLayout?: any;
  initialTheme?: any;
}

export const DynamicCmsNavbar: React.FC<DynamicNavbarProps> = ({
  initialLayout,
  initialTheme,
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isAllowed } = useFeatureFlags();

  const [layout, setLayout] = useState<any>(initialLayout || null);
  const [theme, setTheme] = useState<any>(initialTheme || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!layout) {
      fetch('/api/cms/layouts?type=navbar&isDefault=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.layouts && data.layouts[0]) {
            setLayout(data.layouts[0]);
          }
        })
        .catch(() => {});
    }

    if (!theme) {
      fetch('/api/cms/theme')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.theme) {
            setTheme(data.theme);
          }
        })
        .catch(() => {});
    }
  }, [layout, theme]);

  // Sensible defaults if layout hasn't loaded or is empty
  const logoText =
    layout?.content?.logo?.text || theme?.brand?.companyName || 'SKYLINE RESIDENCES';
  const logoSubtext =
    layout?.content?.logo?.subtext || theme?.brand?.tagline || 'Signature 3D Living';
  const logoIcon = layout?.content?.logo?.icon || 'Building2';
  const logoUrl = layout?.content?.logo?.url || theme?.brand?.logoPrimary || '';

  const menuItems = layout?.content?.menuItems || [
    { id: 'm1', label: 'Home', url: '/', target: '_self' },
    {
      id: 'm2',
      label: 'Residences',
      url: '/properties',
      target: '_self',
      children: [
        { id: 'm2-1', label: 'All Properties', url: '/properties' },
        { id: 'm2-2', label: 'Apartments', url: '/properties?propertyType=Apartment' },
        { id: 'm2-3', label: 'Penthouses', url: '/properties?propertyType=Penthouse' },
        { id: 'm2-4', label: 'Villas', url: '/properties?propertyType=Villa' },
        { id: 'm2-5', label: 'Commercial', url: '/properties?propertyType=Commercial' },
      ],
    },
    {
      id: 'm3',
      label: 'Projects',
      url: '/investment',
      target: '_self',
      children: [
        { id: 'm3-1', label: 'Current Projects', url: '/properties' },
        { id: 'm3-2', label: 'Completed Projects', url: '/about' },
        { id: 'm3-3', label: 'Upcoming Projects', url: '/investment' },
      ],
    },
    { id: 'm4', label: '3D Experience', url: '/3d-experience', target: '_self', icon: 'Compass' },
    { id: 'm5', label: 'Locations', url: '/locations', target: '_self' },
    { id: 'm6', label: 'About', url: '/about', target: '_self' },
    { id: 'm7', label: 'Contact', url: '/contact', target: '_self' },
  ];

  const actions = layout?.content?.actions || [
    { id: 'a1', label: 'Schedule Private Tour', url: '/contact?interest=private-tour', variant: 'primary', authCondition: 'guest' },
  ];

  const templateVariant = layout?.templateVariant || 'logo_left';
  const isSticky = layout?.styling?.isSticky ?? true;
  const isBackdropBlur = layout?.styling?.backdropBlur ?? true;

  // Filter menu items by authentication condition
  const filterByAuth = (item: any) => {
    if (item.authCondition === 'guest' && user) return false;
    if (item.authCondition === 'authenticated' && !user) return false;
    return true;
  };

  const visibleMenuItems = menuItems.filter(filterByAuth);

  return (
    <header
      className={`w-full z-40 transition-all duration-300 ${
        isSticky ? 'sticky top-0' : 'relative'
      } ${
        isScrolled
          ? 'backdrop-blur-xl bg-[#070a0f]/90 border-b border-white/10 shadow-2xl shadow-black/50'
          : isBackdropBlur
          ? 'backdrop-blur-md bg-[#0a0d14]/75 border-b border-white/5'
          : 'bg-[#0a0d14] border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-2.5 group flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={logoText} className="h-9 w-auto object-contain" />
          ) : (
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <DynamicCmsIcon name={logoIcon} className="w-5 h-5 text-white" fallbackIcon={<Building2 className="w-5 h-5 text-white" />} />
            </div>
          )}
          <div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
              {logoText}
            </span>
            {logoSubtext && (
              <span className="hidden sm:block text-[10px] tracking-widest text-slate-400 uppercase font-medium">
                {logoSubtext}
              </span>
            )}
          </div>
        </Link>

        {/* Global Search Bar (Conditionally Gated by Developer) */}
        {isAllowed('globalSearch') && (
          <div className="hidden md:block flex-1 max-w-xs">
            <GlobalSearchBar />
          </div>
        )}

        {/* DESKTOP MENU ITEMS */}
        <nav className="hidden lg:flex items-center space-x-5 text-xs font-medium">
          {visibleMenuItems.map((item: any) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = pathname === item.url || (item.url !== '/' && pathname?.startsWith(item.url));
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => hasChildren && setActiveDropdown(item.id)}
                onMouseLeave={() => hasChildren && setActiveDropdown(null)}
              >
                <Link
                  href={item.url || '#'}
                  target={item.target || '_self'}
                  className={`flex items-center space-x-1.5 py-2 transition-colors relative ${
                    isActive ? 'text-blue-400 font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item.icon && <DynamicCmsIcon name={item.icon} className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{item.label}</span>
                  {hasChildren && <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 rounded font-semibold">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                    />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {hasChildren && activeDropdown === item.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-[#101522] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 shadow-black/60 backdrop-blur-xl"
                  >
                    {item.children.map((sub: any) => {
                      const isSubActive = pathname === sub.url;
                      return (
                        <Link
                          key={sub.id}
                          href={sub.url || '#'}
                          target={sub.target || '_self'}
                          className={`flex items-center space-x-2 px-4 py-2 text-xs transition-colors ${
                            isSubActive ? 'text-blue-400 bg-blue-500/10 font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {sub.icon && <DynamicCmsIcon name={sub.icon} className="w-3.5 h-3.5 text-blue-400" />}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ACTIONS / AUTH BUTTONS */}
        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              href={
                user.isDeveloper
                  ? '/dashboard/developer'
                  : user.isOwner
                  ? '/dashboard/owner'
                  : user.roleId
                  ? '/dashboard/properties'
                  : '/portal'
              }
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
            actions.filter(filterByAuth).map((act: any) => (
              <Link
                key={act.id}
                href={act.url || '/login'}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
                  act.variant === 'primary'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 border border-blue-400/30 font-semibold hover:scale-105'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white'
                }`}
              >
                {act.icon ? (
                  <DynamicCmsIcon name={act.icon} className="w-3.5 h-3.5" />
                ) : act.variant === 'primary' ? (
                  <Calendar className="w-3.5 h-3.5" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{act.label}</span>
              </Link>
            ))
          )}

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-white/5 border border-white/10"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#070a0f] border-b border-white/10 px-4 py-5 space-y-4"
          >
            {isAllowed('globalSearch') && (
              <div className="pb-2">
                <GlobalSearchBar />
              </div>
            )}

            <div className="space-y-2">
              {visibleMenuItems.map((item: any) => (
                <div key={item.id} className="space-y-1">
                  <Link
                    href={item.url || '#'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/5"
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon && <DynamicCmsIcon name={item.icon} className="w-4 h-4 text-blue-400" />}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Sub-items if any */}
                  {item.children && item.children.length > 0 && (
                    <div className="pl-6 space-y-1 border-l border-white/10 ml-3">
                      {item.children.map((sub: any) => (
                        <Link
                          key={sub.id}
                          href={sub.url || '#'}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-2 p-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          {sub.icon && <DynamicCmsIcon name={sub.icon} className="w-3.5 h-3.5 text-blue-400" />}
                          <span>{sub.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
