'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DynamicCmsIcon } from '@/lib/cms/iconResolver';
import {
  Building2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
} from 'lucide-react';

interface DynamicFooterProps {
  initialLayout?: any;
  initialTheme?: any;
}

export const DynamicCmsFooter: React.FC<DynamicFooterProps> = ({
  initialLayout,
  initialTheme,
}) => {
  const [layout, setLayout] = useState<any>(initialLayout || null);
  const [theme, setTheme] = useState<any>(initialTheme || null);

  useEffect(() => {
    if (!layout) {
      fetch('/api/cms/layouts?type=footer&isDefault=true')
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

  const logoText =
    layout?.content?.logo?.text || theme?.brand?.companyName || 'SKYLINE RESIDENCES';
  const logoSubtext =
    layout?.content?.logo?.subtext || theme?.brand?.tagline || 'Signature 3D Living';
  const logoIcon = layout?.content?.logo?.icon || 'Building2';
  const logoUrl = layout?.content?.logo?.url || theme?.brand?.footerLogo || theme?.brand?.logoPrimary || '';

  const columns = layout?.content?.columns || [
    {
      id: 'c1',
      title: 'Explore',
      links: [
        { id: 'l1', label: 'Properties', url: '/properties' },
        { id: 'l2', label: 'Projects', url: '/investment' },
        { id: 'l3', label: 'Locations', url: '/locations' },
        { id: 'l4', label: '3D Experience', url: '/3d-experience' },
      ],
    },
    {
      id: 'c2',
      title: 'Company',
      links: [
        { id: 'l5', label: 'About Us', url: '/about' },
        { id: 'l6', label: 'Investment Portfolio', url: '/investment' },
        { id: 'l7', label: 'Contact Advisory', url: '/contact' },
        { id: 'l8', label: 'Private Viewing', url: '/private-viewing' },
      ],
    },
    {
      id: 'c3',
      title: 'Contact',
      links: [
        { id: 'l9', label: theme?.brand?.phone || '+92 (51) 880-9911', url: `tel:${theme?.brand?.phone || '+92518809911'}`, icon: 'Phone' },
        { id: 'l10', label: theme?.brand?.email || 'concierge@aurasignature.com', url: `mailto:${theme?.brand?.email || 'concierge@aurasignature.com'}`, icon: 'Mail' },
        { id: 'l11', label: theme?.brand?.address || 'Margalla Hillside Avenue, Sector F-7, Islamabad', url: '/locations', icon: 'MapPin' },
        { id: 'l12', label: 'WhatsApp Concierge', url: `https://wa.me/${(theme?.brand?.phone || '92518809911').replace(/[^0-9]/g, '')}`, icon: 'MessageCircle' },
      ],
    },
  ];

  const copyright =
    layout?.content?.copyrightText ||
    `© ${new Date().getFullYear()} ${theme?.brand?.companyName || 'Skyline Residences International'}. Powered by PlayCanvas 3D Engine & Next.js.`;

  return (
    <footer className="w-full bg-[#05080e] border-t border-white/10 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Column 1: Brand & Social */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center space-x-2.5 group">
            {logoUrl ? (
              <img src={logoUrl} alt={logoText} className="h-8 w-auto object-contain" />
            ) : (
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <DynamicCmsIcon name={logoIcon} className="w-4 h-4 text-white" fallbackIcon={<Building2 className="w-4 h-4 text-white" />} />
              </div>
            )}
            <span className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
              {logoText}
            </span>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            {theme?.brand?.tagline ||
              'Pioneering interactive 3D WebGL property discovery and verified luxury real estate transactions with architectural fidelity.'}
          </p>
          {/* Social Links */}
          <div className="flex items-center space-x-3 pt-2">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 rounded-xl border border-white/10 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-pink-600/20 text-slate-400 hover:text-pink-400 rounded-xl border border-white/10 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-blue-400/20 text-slate-400 hover:text-blue-300 rounded-xl border border-white/10 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/${(theme?.brand?.phone || '92518809911').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/5 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 rounded-xl border border-white/10 transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400 pt-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Government Verified & Licensed International Real Estate Developer</span>
          </div>
        </div>

        {/* Columns 2, 3, 4: Explore, Company, Contact */}
        {columns.map((col: any) => (
          <div key={col.id} className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wide">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((link: any) => (
                <li key={link.id}>
                  <Link
                    href={link.url || '#'}
                    className="flex items-center space-x-2 hover:text-white transition-colors"
                  >
                    {link.icon && <DynamicCmsIcon name={link.icon} className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Row: Legal & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
        <span>{copyright}</span>
        <div className="flex items-center space-x-4">
          <Link href="/about" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-slate-400 transition-colors">Cookies Policy</Link>
        </div>
      </div>
    </footer>
  );
};
