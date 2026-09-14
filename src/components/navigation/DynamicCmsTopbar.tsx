'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageCircle, Calendar, ArrowRight, X } from 'lucide-react';

interface DynamicTopbarProps {
  initialLayout?: any;
  initialTheme?: any;
}

export const DynamicCmsTopbar: React.FC<DynamicTopbarProps> = ({
  initialLayout,
  initialTheme,
}) => {
  const [layout, setLayout] = useState<any>(initialLayout || null);
  const [theme, setTheme] = useState<any>(initialTheme || null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!layout) {
      fetch('/api/cms/layouts?type=topbar&isDefault=true')
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

  if (dismissed) return null;

  const phone = layout?.content?.phone || theme?.brand?.phone || '+92 (51) 880-9911';
  const email = layout?.content?.email || theme?.brand?.email || 'concierge@aurasignature.com';
  const whatsappNumber = layout?.content?.whatsapp || theme?.brand?.whatsapp || phone.replace(/[^0-9]/g, '');
  const tagline = layout?.content?.tagline || 'Luxury Living. Designed Around You.';
  const ctaLabel = layout?.content?.ctaLabel || 'Book a Visit';
  const ctaUrl = layout?.content?.ctaUrl || '/contact?interest=private-tour';
  const showDismiss = layout?.content?.showDismiss || false;

  return (
    <div
      className="w-full text-xs transition-all relative z-50 border-b border-white/10"
      style={{
        backgroundColor: layout?.styling?.bgColor || '#070a0f',
        color: layout?.styling?.textColor || '#cbd5e1',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        {/* Left Tagline */}
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse hidden sm:inline-block" />
          <span className="text-[11px] sm:text-xs font-medium tracking-wide text-slate-300 truncate">
            {tagline}
          </span>
        </div>

        {/* Right Contact Icons & Quick Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-[11px]">
          {/* Phone Link */}
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center space-x-1.5 text-slate-300 hover:text-blue-400 transition-colors"
            title="Call Concierge"
          >
            <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="hidden md:inline font-mono">{phone}</span>
          </a>

          {/* Email Link */}
          <a
            href={`mailto:${email}`}
            className="hidden lg:flex items-center space-x-1.5 text-slate-300 hover:text-blue-400 transition-colors"
            title="Email VIP Desk"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-sans">{email}</span>
          </a>

          {/* WhatsApp Direct Link */}
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xl:inline">WhatsApp</span>
          </a>

          {/* Book Visit CTA Button */}
          <Link
            href={ctaUrl}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg text-[11px] font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{ctaLabel}</span>
          </Link>

          {/* Optional Dismiss button */}
          {showDismiss && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-slate-500 hover:text-slate-300 p-0.5 ml-1"
              aria-label="Dismiss topbar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
