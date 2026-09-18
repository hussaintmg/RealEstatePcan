import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { validatePageSlug } from '@/lib/cms/slugValidator';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  try {
    const page = await CmsPage.findById(params.id).lean();
    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await req.json();
    const pageId = params.id;

    const existing = await CmsPage.findById(pageId);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    // If slug is being updated, validate uniqueness and namespaces
    if (body.slug !== undefined && body.slug !== existing.slug) {
      const slugCheck = await validatePageSlug(body.slug, pageId);
      if (!slugCheck.valid) {
        return NextResponse.json({ success: false, error: slugCheck.error }, { status: 400 });
      }
      existing.slug = slugCheck.normalizedSlug;
    }

    if (body.title !== undefined) existing.title = body.title;
    if (body.status !== undefined) {
      existing.status = body.status;
      existing.isPublished = body.status === 'published';
    }
    if (body.sections !== undefined) existing.sections = body.sections;
    if (body.layout !== undefined) existing.layout = body.layout;
    if (body.themeId !== undefined) existing.themeId = body.themeId;
    if (body.seo !== undefined) existing.seo = body.seo;
    if (body.customVariables !== undefined) existing.customVariables = body.customVariables;

    // Concurrency conflict detection: if expectedVersion is provided
    if (body.expectedVersion && existing.version !== body.expectedVersion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Version conflict detected. Another editor has modified this page. Please refresh to load the latest changes.',
          currentVersion: existing.version,
        },
        { status: 409 }
      );
    }

    await existing.save();

    return NextResponse.json({ success: true, page: existing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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
    const page = await CmsPage.findById(pageId);
    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    if (page.isSystemPage) {
      // System pages should be disabled rather than deleted
      page.status = 'disabled';
      page.isPublished = false;
      await page.save();
      return NextResponse.json({
        success: true,
        message: 'System page disabled. Default system pages cannot be permanently deleted.',
        page,
      });
    }

    // Soft-archive custom page
    page.status = 'archived';
    page.isPublished = false;
    await page.save();

    return NextResponse.json({ success: true, message: 'Page archived successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
