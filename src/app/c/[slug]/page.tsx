'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { UniversalSectionRenderer } from '@/lib/cms/sdk/UniversalSectionRenderer';
import { CmsSectionRenderer } from '@/components/cms/CmsSectionRenderer';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { resolveSeoMetadata, generateJsonLd } from '@/lib/cms/seoEngine';
import { Loader2, FileQuestion, ShieldAlert } from 'lucide-react';

export default function DynamicCmsPage() {
  const { slug } = useParams();
  const pageSlug = Array.isArray(slug) ? slug[0] : slug;

  const [page, setPage] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (!pageSlug) return;

    // Fetch CMS Page
    fetch(`/api/cms/pages?slug=${pageSlug}&includeDisabled=true`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.page) {
          if (data.page.status === 'disabled') {
            setIsDisabled(true);
          } else {
            setPage(data.page);
          }
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
      <div className="min-h-screen bg-[#070a0f] flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs uppercase tracking-wider font-semibold">Resolving Architectural Page...</span>
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div className="min-h-screen bg-[#070a0f] text-white flex flex-col justify-between">
        <DynamicCmsNavbar initialTheme={theme} />
        <div className="max-w-md mx-auto py-28 text-center space-y-4 px-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-bold">Page Temporarily Offline</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This page has been disabled by the site administrator. Please check back later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            Return to Homepage
          </Link>
        </div>
        <DynamicCmsFooter initialTheme={theme} />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-[#070a0f] text-white flex flex-col justify-between">
        <DynamicCmsNavbar initialTheme={theme} />
        <div className="max-w-md mx-auto py-28 text-center space-y-4 px-4">
          <FileQuestion className="w-12 h-12 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-bold">Page Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            No active CMS page matching slug &ldquo;{pageSlug}&rdquo; exists or is published.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            Return to Homepage
          </Link>
        </div>
        <DynamicCmsFooter initialTheme={theme} />
      </div>
    );
  }

  const dataContext = {
    brand: theme?.brand || { name: 'Aura Heights Luxury Estates' },
    theme: theme || {},
    year: new Date().getFullYear(),
    route: { slug: pageSlug },
  };

  const sortedSections = [...(page.sections || [])].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0)
  );

  const seoData = resolveSeoMetadata(page.seo, page.title, page.slug, dataContext);
  const jsonLd = generateJsonLd(page.seo?.structuredDataType || 'Organization', {
    title: seoData.title,
    description: seoData.description,
    canonicalUrl: seoData.canonical,
    brandName: dataContext.brand.name,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070a0f] text-white selection:bg-blue-600 selection:text-white">
      {/* Structured Data Script Tag */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <DynamicCmsTopbar initialTheme={theme} />
      <DynamicCmsNavbar initialTheme={theme} />

      <main className="flex-1 w-full space-y-8 py-4">
        {sortedSections.map((section: any) => {
          const definition = getSectionDefinition(section.sectionKey || section.type);

          // If Section SDK definition or custom tree exists, render via UniversalSectionRenderer
          if (definition || section.customTreeOverride) {
            return (
              <UniversalSectionRenderer
                key={section.id}
                section={section}
                definition={definition}
                dataContext={dataContext}
                isEditing={false}
              />
            );
          }

          // Fallback to legacy CmsSectionRenderer for any older pre-Module 7 sections
          return (
            <CmsSectionRenderer
              key={section.id}
              section={section}
              dataContext={dataContext}
            />
          );
        })}
      </main>

      <DynamicCmsFooter initialTheme={theme} />
    </div>
  );
}
