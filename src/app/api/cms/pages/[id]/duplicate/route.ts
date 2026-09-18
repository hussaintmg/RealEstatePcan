import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { validatePageSlug } from '@/lib/cms/slugValidator';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pageId = params.id;
    const original = await CmsPage.findById(pageId).lean();
    if (!original) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    // Generate fresh duplicate slug
    let newSlug = `${original.slug || 'page'}-copy`;
    let slugCheck = await validatePageSlug(newSlug);
    let counter = 2;
    while (!slugCheck.valid) {
      newSlug = `${original.slug || 'page'}-copy-${counter}`;
      slugCheck = await validatePageSlug(newSlug);
      counter++;
    }

    // Deep copy sections with fresh unique IDs
    const clonedSections = (original.sections || []).map((sec: any) => ({
      ...sec,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    }));

    const duplicated = await CmsPage.create({
      title: `${original.title} (Copy)`,
      slug: slugCheck.normalizedSlug,
      status: 'draft',
      isPublished: false,
      isSystemPage: false,
      sections: clonedSections,
      layout: original.layout,
      themeId: original.themeId,
      seo: {
        metaTitle: `${original.seo?.metaTitle || original.title} (Copy)`,
        metaDescription: original.seo?.metaDescription || '',
      },
      version: 1,
      createdBy: user.userId,
    });

    return NextResponse.json({ success: true, page: duplicated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
