import mongoose from 'mongoose';
import { connectToDatabase } from '../db';
import { CmsPage } from '../../models/CmsPage';
import { User } from '../../models/User';
import { getSectionDefinition } from './sdk/sectionLibrary';

export async function ensureDefaultSystemPages() {
  await connectToDatabase();

  const count = await CmsPage.countDocuments({ status: { $ne: 'archived' } });
  if (count > 0) {
    return;
  }

  // Find an admin user to attribute creation to
  let admin = await User.findOne({ $or: [{ isOwner: true }, { isDeveloper: true }] });
  const adminId = admin?._id || new mongoose.Types.ObjectId();

  const defaultDefs = [
    {
      title: 'Home',
      slug: 'home',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'Aura Heights | Contemporary Luxury Architecture & 3D Tours',
        metaDescription: 'Discover bespoke hillside residences with real-time PlayCanvas 3D walkthroughs.',
      },
      sections: [
        { key: 'hero_cinematic', order: 1, title: 'Hero Cinematic' },
        { key: 'prop_grid_v1', order: 2, title: 'Signature Properties' },
        { key: 'vr_3d_v1', order: 3, title: 'Interactive 3D Walkthrough' },
        { key: 'testimonials_v1', order: 4, title: 'Client Accolades' },
        { key: 'cta_v1', order: 5, title: 'Private Advisory Desk' },
      ],
    },
    {
      title: 'Properties Portfolio',
      slug: 'properties',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'Curated Architectural Portfolio | Aura Heights',
        metaDescription: 'Browse ultra-luxury estates, penthouses, and private islands with bank-grade verified title deeds.',
      },
      sections: [
        { key: 'prop_grid_v1', order: 1, title: 'Curated Estates' },
        { key: 'cta_v1', order: 2, title: 'Private Advisory' },
      ],
    },
    {
      title: 'About Aura Heights',
      slug: 'about',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'About Aura Heights | Architectural Assurance & Discretion',
        metaDescription: 'Learn about our engineering philosophy, escrow assurance, and private advisory services.',
      },
      sections: [
        { key: 'features_v1', order: 1, title: 'Architectural Assurance' },
        { key: 'stats_v1', order: 2, title: 'Portfolio Metrics' },
        { key: 'testimonials_v1', order: 3, title: 'Client Accolades' },
      ],
    },
    {
      title: 'Contact & Private Advisory',
      slug: 'contact',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'Contact Our Senior Property Directors | Aura Heights',
        metaDescription: 'Schedule a confidential consultation or private viewing with our senior advisory team.',
      },
      sections: [
        { key: 'contact_form_v1', order: 1, title: 'Private Desk Inquiries' },
      ],
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'Privacy Policy | Aura Heights',
        metaDescription: 'Our commitment to confidential representation and high-net-worth data protection.',
      },
      sections: [
        { key: 'cta_v1', order: 1, title: 'Privacy & Discretion Framework' },
      ],
    },
    {
      title: 'Terms of Service',
      slug: 'terms',
      isSystemPage: true,
      status: 'published' as const,
      seo: {
        metaTitle: 'Terms of Service | Aura Heights',
        metaDescription: 'Terms governing estate acquisitions, 3D model representations, and escrow agreements.',
      },
      sections: [
        { key: 'cta_v1', order: 1, title: 'Terms & Escrow Regulations' },
      ],
    },
  ];

  for (const pageDef of defaultDefs) {
    const formattedSections = pageDef.sections.map((sec, idx) => {
      const def = getSectionDefinition(sec.key);
      return {
        id: `sec-default-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        type: sec.key,
        sectionKey: sec.key,
        sectionVersion: def?.version || '1.0.0',
        title: sec.title,
        order: sec.order,
        isVisible: true,
        props: def ? { ...def.defaultProps } : {},
        styles: {},
        conditions: [],
        animation: { type: 'fade', duration: 0.5 },
      };
    });

    await CmsPage.create({
      title: pageDef.title,
      slug: pageDef.slug,
      isSystemPage: true,
      status: pageDef.status,
      isPublished: pageDef.status === 'published',
      sections: formattedSections,
      seo: pageDef.seo,
      version: 1,
      createdBy: adminId,
    });
  }
}
