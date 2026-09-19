'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDesignTokens } from './DesignTokenProvider';
import { Menu, X, Compass, Search, Phone, Shield, ArrowRight } from 'lucide-react';

export const PublicLayoutRenderer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeThemeKey, publicLayouts } = useDesignTokens();
  const [mobileOpen, setMobileOpen] = useState(false);

  const topbarKey = publicLayouts.topbarKey;
  const footerKey = publicLayouts.footerKey;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background,#0a0d14)] text-[var(--foreground,#f8fafc)]">
      {/* Dynamic Topbar */}
      <header
        className={`w-full z-40 transition-all ${
          publicLayouts.stickyNav ? 'sticky top-0' : 'relative'
        } bg-[var(--background,#0a0d14)]/80 backdrop-blur-md border-b border-[var(--border,rgba(255,255,255,0.1))]`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary,#d4af37)] text-[var(--primary-foreground,#0a0d14)] flex items-center justify-center font-bold text-sm shadow-md">
              A
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[var(--foreground,#ffffff)] block">
                AURA HEIGHTS
              </span>
              <span className="text-[10px] text-[var(--muted-foreground,#94a3b8)] tracking-wider uppercase block">
                Architectural 3D Spaces
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--muted-foreground,#94a3b8)]">
            <Link href="/" className="hover:text-[var(--foreground,#ffffff)] transition-colors">
              Home
            </Link>
            <Link href="/properties" className="hover:text-[var(--foreground,#ffffff)] transition-colors">
              Residences
            </Link>
            <Link href="/#virtual-tour" className="hover:text-[var(--foreground,#ffffff)] transition-colors flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[var(--primary,#d4af37)]" />
              3D Tours
            </Link>
            <Link href="/portal" className="hover:text-[var(--foreground,#ffffff)] transition-colors">
              VIP Portal
            </Link>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={publicLayouts.ctaUrl || '/#contact'}
              className="px-4 py-2 rounded-[var(--radius,0.5rem)] text-xs font-semibold bg-[var(--primary,#d4af37)] text-[var(--primary-foreground,#0a0d14)] hover:brightness-110 shadow-md transition-all active:scale-95"
            >
              {publicLayouts.ctaText || 'Book VIP Viewing'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--surface-1,#111726)] p-5 space-y-4 animate-reveal-up">
            <div className="space-y-2 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                Home
              </Link>
              <Link
                href="/properties"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                Residences
              </Link>
              <Link
                href="/#virtual-tour"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                3D Virtual Tours
              </Link>
              <Link
                href="/portal"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
              >
                Verified Buyer Portal
              </Link>
            </div>
            <div className="pt-3 border-t border-slate-800">
              <Link
                href="/#contact"
                onClick={() => setMobileOpen(false)}
                className="w-full block text-center py-2.5 rounded-[var(--radius,0.5rem)] text-xs font-bold bg-[var(--primary,#d4af37)] text-[var(--primary-foreground,#0a0d14)] shadow-md"
              >
                Book VIP Private Viewing
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">{children}</main>

      {/* Dynamic Footer */}
      <footer className="border-t border-[var(--border,rgba(255,255,255,0.1))] bg-[var(--surface-1,#0d111a)] text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[var(--primary,#d4af37)] text-[var(--primary-foreground,#0a0d14)] flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="text-sm font-bold text-slate-100">AURA HEIGHTS</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Pioneering architectural living in Islamabad with photorealistic PlayCanvas 3D virtual walkthroughs.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Portfolio</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/properties?type=Penthouse" className="hover:text-slate-200">Skyline Penthouses</Link></li>
                <li><Link href="/properties?type=Villa" className="hover:text-slate-200">Signature Villas</Link></li>
                <li><Link href="/properties?type=Apartment" className="hover:text-slate-200">Modern Residences</Link></li>
              </ul>
            </div>

            {/* Advisory */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Private Advisory</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="tel:+92518809911" className="hover:text-slate-200">+92 (51) 880-9911</a></li>
                <li><a href="mailto:concierge@auraheights.local" className="hover:text-slate-200">concierge@auraheights.local</a></li>
                <li><span>Sector F-7/2, Margalla Ridge, Islamabad</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Integrity & Escrow</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                All deal documents and milestone invoices are cryptographically audited with strict escrow tracking.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>© {new Date().getFullYear()} Aura Heights Luxury Real Estate. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-slate-300">Staff Login</Link>
              <Link href="/portal" className="hover:text-slate-300">Buyer Portal</Link>
              <span className="font-mono text-[10px] text-slate-600">Theme: {activeThemeKey}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
