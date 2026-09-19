import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { validatePageSlug } from '@/lib/cms/slugValidator';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { ensureDefaultSystemPages } from '@/lib/cms/defaultPages';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const includeDisabled = searchParams.get('includeDisabled') === 'true';

  try {
    if (slug !== null) {
      const normalizedSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
      const query: any = { slug: normalizedSlug };
      
      const page = await CmsPage.findOne(query).lean();
      if (!page) {
        return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
      }

      // Check if disabled/archived and requested by public visitor
      if (!includeDisabled && (page.status === 'disabled' || page.status === 'archived')) {
        return NextResponse.json(
          { success: false, error: 'This page is currently unavailable or disabled by site administrator.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, page });
    }

    // Ensure default system pages exist
    await ensureDefaultSystemPages();

    // List all pages for CMS dashboard
    const pages = await CmsPage.find({ status: { $ne: 'archived' } })
      .sort({ isSystemPage: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, template = 'blank', status = 'draft', seo } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Page title is required' }, { status: 400 });
    }

    // Validate slug
    const slugCheck = await validatePageSlug(slug || title);
    if (!slugCheck.valid) {
      return NextResponse.json({ success: false, error: slugCheck.error }, { status: 400 });
    }

    // Seed initial sections based on template choice
    const initialSections: any[] = [];
    if (template === 'luxury_home') {
      const heroDef = getSectionDefinition('hero_cinematic');
      const gridDef = getSectionDefinition('prop_grid_v1');
      const ctaDef = getSectionDefinition('cta_v1');
      if (heroDef) {
        initialSections.push({
          id: `sec-${Date.now()}-1`,
          type: heroDef.key,
          sectionKey: heroDef.key,
          sectionVersion: heroDef.version,
          title: heroDef.metadata.name,
          order: 1,
          isVisible: true,
          props: heroDef.defaultProps,
        });
      }
      if (gridDef) {
        initialSections.push({
          id: `sec-${Date.now()}-2`,
          type: gridDef.key,
          sectionKey: gridDef.key,
          sectionVersion: gridDef.version,
          title: gridDef.metadata.name,
          order: 2,
          isVisible: true,
          props: gridDef.defaultProps,
        });
      }
      if (ctaDef) {
        initialSections.push({
          id: `sec-${Date.now()}-3`,
          type: ctaDef.key,
          sectionKey: ctaDef.key,
          sectionVersion: ctaDef.version,
          title: ctaDef.metadata.name,
          order: 3,
          isVisible: true,
          props: ctaDef.defaultProps,
        });
      }
    } else if (template === 'property_detail') {
      const detailDef = getSectionDefinition('prop_detail_v1');
      const vrDef = getSectionDefinition('vr_3d_v1');
      if (detailDef) {
        initialSections.push({
          id: `sec-${Date.now()}-1`,
          type: detailDef.key,
          sectionKey: detailDef.key,
          sectionVersion: detailDef.version,
          title: detailDef.metadata.name,
          order: 1,
          isVisible: true,
          props: detailDef.defaultProps,
        });
      }
      if (vrDef) {
        initialSections.push({
          id: `sec-${Date.now()}-2`,
          type: vrDef.key,
          sectionKey: vrDef.key,
          sectionVersion: vrDef.version,
          title: vrDef.metadata.name,
          order: 2,
          isVisible: true,
          props: vrDef.defaultProps,
        });
      }
    }

    const newPage = await CmsPage.create({
      title,
      slug: slugCheck.normalizedSlug,
      status,
      isPublished: status === 'published',
      sections: initialSections,
      seo: {
        metaTitle: seo?.metaTitle || `${title} | Signature Residences`,
        metaDescription: seo?.metaDescription || `Discover architectural excellence on ${title}.`,
      },
      version: 1,
      createdBy: user.userId,
    });

    return NextResponse.json({ success: true, page: newPage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
