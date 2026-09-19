'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Palette,
  Type,
  LayoutGrid,
  Square,
  Sparkles,
  Activity,
  ArrowRight,
  CheckCircle,
  Eye,
  Layers,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export default function CmsOverviewPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const featureCards = [
    {
      title: 'Theme Families (25 Curated)',
      desc: 'Obsidian luxury, brutalist, high fashion, warm stone, and 21 other complete styling presets.',
      href: '/dashboard/website/cms/themes',
      icon: Palette,
      badge: config?.activeThemeKey || 'luxury-dark',
      color: 'from-amber-500/20 to-amber-700/10 border-amber-500/30',
    },
    {
      title: 'Typography Engine',
      desc: 'Editorial serifs, geometric grotesque sans, fluid clamp() scales, and Google Font loaders.',
      href: '/dashboard/website/cms/typography',
      icon: Type,
      badge: config?.typography?.pairingId || 'luxury-editorial',
      color: 'from-blue-500/20 to-blue-700/10 border-blue-500/30',
    },
    {
      title: 'Public Layout Builders',
      desc: '25 Topbar templates, 25 Mobile Navigation variants, and 25 Footer designs with live data slots.',
      href: '/dashboard/website/cms/public-design',
      icon: LayoutGrid,
      badge: '25 Topbars | 25 Footers',
      color: 'from-purple-500/20 to-purple-700/10 border-purple-500/30',
    },
    {
      title: 'Dashboard Layouts & Shells',
      desc: '25 Executive command bars, 25 RBAC-safe sidebars, and dedicated Customer Portal shells.',
      href: '/dashboard/website/cms/dashboard-design',
      icon: Layers,
      badge: '25 Dash Layouts',
      color: 'from-emerald-500/20 to-emerald-700/10 border-emerald-500/30',
    },
    {
      title: 'Component Design Tokens',
      desc: 'Custom styling for Buttons (6 variants), Cards (5 variants), Inputs, and Form layouts.',
      href: '/dashboard/website/cms/components',
      icon: Square,
      badge: 'Standardized Tokens',
      color: 'from-rose-500/20 to-rose-700/10 border-rose-500/30',
    },
    {
      title: 'Animation & Hover Engines',
      desc: 'CSS micro-transitions, Framer Motion UI states, GSAP ScrollTrigger, and 25 hover effects.',
      href: '/dashboard/website/cms/animations',
      icon: Sparkles,
      badge: '25 Anim + 25 Hover',
      color: 'from-cyan-500/20 to-cyan-700/10 border-cyan-500/30',
    },
    {
      title: 'Content-Accurate Skeletons',
      desc: '25 Content-matching skeleton patterns with pulse, shimmer, wave, and static controls.',
      href: '/dashboard/website/cms/skeletons',
      icon: Activity,
      badge: '25 Skeletons',
      color: 'from-orange-500/20 to-orange-700/10 border-orange-500/30',
    },
    {
      title: 'Live Responsive Preview',
      desc: 'Isolated simulated preview on Desktop (1440px), Tablet (768px), and Mobile (375px) viewports.',
      href: '/dashboard/website/cms/preview',
      icon: Eye,
      badge: 'Isolated Canvas',
      color: 'from-indigo-500/20 to-indigo-700/10 border-indigo-500/30',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Module 6 Design System Foundation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            CMS Design System Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Centralized design token engine, theme registry, typography, and public/dashboard layout builders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/website/cms/preview"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Site
          </Link>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                config?.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            Status: <span className="font-semibold uppercase text-slate-200">{config?.status || 'Draft'}</span>
            <span className="text-slate-600">|</span>
            Version: <span className="font-semibold text-slate-200">v{config?.currentVersion || 1}</span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`group p-5 rounded-xl bg-gradient-to-br ${card.color} bg-slate-900/60 border hover:border-slate-600 transition-all hover:shadow-xl flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-200 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                    {card.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{card.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-medium text-amber-400/90 group-hover:text-amber-300">
                <span>Configure</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Architecture Guarantees Info Banner */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Zero Script Injection Guaranteed</strong>: All design tokens, themes, and layouts are schema-validated.
            No arbitrary HTML/JS payloads can be injected through CMS fields.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Immutable Rollback Supported</span>
        </div>
      </div>
    </div>
  );
}
