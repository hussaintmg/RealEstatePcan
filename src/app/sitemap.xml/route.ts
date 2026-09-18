import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';

export async function GET() {
  try {
    await connectToDatabase();

    // Query strictly published & non-disabled pages
    const publishedPages = await CmsPage.find({
      status: 'published',
      'seo.noIndex': { $ne: true },
    }).lean();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://auraheights.com';

    const xmlUrls = publishedPages.map((page) => {
      const isHome = page.slug === '' || page.slug === 'home';
      const loc = isHome ? baseUrl : `${baseUrl}/c/${page.slug}`;
      const lastMod = new Date(page.updatedAt || Date.now()).toISOString().split('T')[0];
      const priority = isHome ? '1.0' : '0.8';

      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlUrls.join('')}
</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
