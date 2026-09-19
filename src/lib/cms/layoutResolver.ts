import { connectToDatabase } from '../db';
import { CmsLayout, ICmsLayout } from '../../models/CmsLayout';
import { CmsTheme, ICmsTheme } from '../../models/CmsTheme';
import { CmsDesignConfig } from '../../models/CmsDesignConfig';
import { getTopbarTemplateByKey } from './design/publicTopbars';
import { getFooterTemplateByKey } from './design/publicFooters';

export async function resolveLayout(
  type: 'topbar' | 'navbar' | 'sidebar' | 'footer',
  specificId?: string
): Promise<any> {
  await connectToDatabase();

  try {
    if (specificId) {
      const specific = await CmsLayout.findById(specificId).lean();
      if (specific) return specific;
    }

    // Check CmsDesignConfig first
    const designConfig = await CmsDesignConfig.findOne({ siteKey: 'default' }).lean();
    if (designConfig?.publicLayouts) {
      if ((type === 'topbar' || type === 'navbar') && designConfig.publicLayouts.topbarKey) {
        const tpl = getTopbarTemplateByKey(designConfig.publicLayouts.topbarKey);
        if (tpl) {
          const fallback = getBuiltInLayoutFallback(type);
          return {
            ...fallback,
            templateVariant: tpl.layoutStyle,
            styling: {
              ...(fallback?.styling || {}),
              isSticky: tpl.sticky,
              backdropBlur: tpl.backdropBlur,
              height: tpl.height,
            },
          };
        }
      }
      if (type === 'footer' && designConfig.publicLayouts.footerKey) {
        const ftr = getFooterTemplateByKey(designConfig.publicLayouts.footerKey);
        if (ftr) {
          const fallback = getBuiltInLayoutFallback('footer');
          return {
            ...fallback,
            templateVariant: ftr.layoutStyle,
          };
        }
      }
    }

    // Otherwise find default layout of that type
    const defaultLayout = await CmsLayout.findOne({ type, isDefault: true }).lean();
    if (defaultLayout) return defaultLayout;

    // Fallback to any layout of that type
    const anyLayout = await CmsLayout.findOne({ type }).lean();
    if (anyLayout) return anyLayout;

    // Built-in fallback if no database record exists yet
    return getBuiltInLayoutFallback(type);
  } catch {
    return getBuiltInLayoutFallback(type);
  }
}

export function getBuiltInLayoutFallback(type: string): any {
  if (type === 'navbar') {
    return {
      type: 'navbar',
      title: 'Default Luxury Navbar',
      slug: 'default-navbar',
      templateVariant: 'logo_left',
      isDefault: true,
      content: {
        logo: {
          type: 'brand',
          text: 'AURA HEIGHTS',
          subtext: '3D Living Spaces',
          icon: 'Building2',
        },
        menuItems: [
          { id: 'm1', label: 'Home', url: '/', target: '_self' },
          { id: 'm2', label: 'Properties', url: '/properties', target: '_self' },
          { id: 'm3', label: '3D Virtual Tours', url: '/#virtual-tour', target: '_self', icon: 'Compass' },
          { id: 'm4', label: 'Contact', url: '/#contact', target: '_self' },
        ],
        actions: [
          { id: 'a1', label: 'Client / Staff Login', url: '/login', variant: 'outline', authCondition: 'guest' },
        ],
      },
      styling: {
        bgColor: '#0a0d14',
        isSticky: true,
        backdropBlur: true,
      },
    };
  }

  if (type === 'footer') {
    return {
      type: 'footer',
      title: 'Default Multi-Column Footer',
      slug: 'default-footer',
      templateVariant: 'multicolumn',
      isDefault: true,
      content: {
        logo: {
          type: 'brand',
          text: 'AURA HEIGHTS',
          subtext: '3D Living Spaces',
          icon: 'Building2',
        },
        columns: [
          {
            id: 'c1',
            title: 'Quick Navigation',
            links: [
              { id: 'l1', label: 'Home Experience', url: '/' },
              { id: 'l2', label: 'Exclusive Listings', url: '/properties' },
              { id: 'l3', label: '3D PlayCanvas Tours', url: '/#virtual-tour' },
              { id: 'l4', label: 'Verified Customer Portal', url: '/portal' },
            ],
          },
          {
            id: 'c2',
            title: 'Property Types',
            links: [
              { id: 'l5', label: 'Signature Villas', url: '/properties?propertyType=Villa' },
              { id: 'l6', label: 'Skyline Penthouses', url: '/properties?propertyType=Penthouse' },
              { id: 'l7', label: 'Smart High-Rise Residences', url: '/properties?propertyType=Apartment' },
              { id: 'l8', label: 'Prime Commercial Suites', url: '/properties?propertyType=Commercial' },
            ],
          },
          {
            id: 'c3',
            title: 'Direct Advisory',
            links: [
              { id: 'l9', label: '+92 (51) 880-9911 / WhatsApp', url: 'tel:+92518809911', icon: 'Phone' },
              { id: 'l10', label: 'concierge@auraheights.local', url: 'mailto:concierge@auraheights.local', icon: 'Mail' },
              { id: 'l11', label: 'Margalla Hillside Avenue, Sector F-7, Islamabad', url: '#', icon: 'MapPin' },
            ],
          },
        ],
        copyrightText: '© 2026 Aura Heights Ltd. Powered by PlayCanvas 3D Engine & Next.js. Strict Privacy & Encrypted Document Retention.',
      },
    };
  }

  return null;
}
