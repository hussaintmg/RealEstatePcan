import { parseStringToTokens, interpolateTokens } from './tokenEngine';

export interface PageSeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: 'index, follow' | 'noindex, nofollow' | 'index, nofollow' | 'noindex, follow';
  structuredDataType?: 'RealEstateListing' | 'Organization' | 'WebSite' | 'FAQPage' | 'None';
}

/**
 * Resolves SEO title and description, interpolating any variable tokens
 * (e.g. "[property.title] for Sale").
 */
export function resolveSeoMetadata(
  seo: PageSeoConfig = {},
  pageTitle: string = 'Signature Residences',
  pageSlug: string = '',
  context: Record<string, any> = {}
): {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robots: string;
} {
  const rawTitle = seo.metaTitle || pageTitle;
  const rawDesc = seo.metaDescription || 'Exclusive architectural developments and luxury residences.';

  const titleTokens = parseStringToTokens(rawTitle);
  const descTokens = parseStringToTokens(rawDesc);

  const title = interpolateTokens(titleTokens, context);
  const description = interpolateTokens(descTokens, context);

  const canonical = seo.canonicalUrl || `https://auraheights.com/${pageSlug ? `c/${pageSlug}` : ''}`;
  const ogTitle = seo.ogTitle ? interpolateTokens(parseStringToTokens(seo.ogTitle), context) : title;
  const ogDescription = seo.ogDescription ? interpolateTokens(parseStringToTokens(seo.ogDescription), context) : description;
  const ogImage = seo.ogImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  const robots = seo.robots || 'index, follow';

  return {
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    robots,
  };
}

/**
 * Generates safe JSON-LD structured data without arbitrary script tags.
 */
export function generateJsonLd(
  type: 'RealEstateListing' | 'Organization' | 'WebSite' | 'FAQPage' | 'None' = 'WebSite',
  data: Record<string, any> = {}
): object | null {
  if (type === 'None') return null;

  switch (type) {
    case 'RealEstateListing':
      return {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: data.title || 'Signature Residence',
        description: data.description || 'Luxury architectural villa.',
        url: data.canonicalUrl,
        price: data.price ? String(data.price) : undefined,
        priceCurrency: 'USD',
        offers: {
          '@type': 'Offer',
          price: data.price ? String(data.price) : undefined,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      };

    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.brandName || 'Aura Heights Luxury Real Estate',
        url: 'https://auraheights.com',
        logo: data.logoUrl || 'https://auraheights.com/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: data.phone || '+1-800-AURA-ESTATES',
          contactType: 'Sales and Private Viewing Advisory',
        },
      };

    case 'FAQPage':
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: Array.isArray(data.faqItems)
          ? data.faqItems.map((item: any) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            }))
          : [],
      };

    case 'WebSite':
    default:
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: data.siteName || 'Aura Heights',
        url: 'https://auraheights.com',
      };
  }
}
