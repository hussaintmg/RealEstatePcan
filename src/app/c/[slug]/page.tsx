'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { CmsSectionRenderer } from '@/components/cms/CmsSectionRenderer';
import { Loader2, FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function DynamicCmsPage() {
  const { slug } = useParams();
  const pageSlug = Array.isArray(slug) ? slug[0] : slug;

  const [page, setPage] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!pageSlug) return;

    // Fetch CMS Page
    fetch(`/api/cms/pages?slug=${pageSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.page) {
          setPage(data.page);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Fetch Theme
    fetch('/api/cms/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.theme) {
          setTheme(data.theme);
        }
      })
      .catch(() => {});
  }, [pageSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs uppercase tracking-wider font-semibold">Resolving CMS Page...</span>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col justify-between">
        <DynamicCmsNavbar initialTheme={theme} />
        <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4">
          <FileQuestion className="w-12 h-12 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-xs text-slate-400">
            No CMS page matching slug &ldquo;{pageSlug}&rdquo; was found or published.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Return Home
          </Link>
        </div>
        <DynamicCmsFooter initialTheme={theme} />
      </div>
    );
  }

  const dataContext = {
    brand: theme?.brand || {},
    theme: theme || {},
    year: new Date().getFullYear(),
    route: { slug: pageSlug },
  };

  const sortedSections = [...(page.sections || [])].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-white selection:bg-blue-600 selection:text-white">
      <DynamicCmsTopbar initialTheme={theme} />
      <DynamicCmsNavbar initialTheme={theme} />

      <main className="flex-1 w-full space-y-6 py-8">
        {sortedSections.map((section: any) => (
          <CmsSectionRenderer
            key={section.id}
            section={section}
            dataContext={dataContext}
          />
        ))}
      </main>

      <DynamicCmsFooter initialTheme={theme} />
    </div>
  );
}
