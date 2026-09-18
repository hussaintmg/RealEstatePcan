import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { CmsSectionDefinition } from '@/models/CmsSectionDefinition';
import { logAuditEvent } from '@/lib/auditLogger';

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
    const page = await CmsPage.findById(pageId);
    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    // 1. Validation Before Atomic Publish
    const sections = page.sections || [];
    for (const sec of sections) {
      // Verify section key exists in library or custom database sections
      const key = sec.sectionKey || sec.type;
      let def = key ? getSectionDefinition(key) : undefined;
      if (!def && key) {
        def = (await CmsSectionDefinition.findOne({ key }).lean()) as any;
      }

      if (!def && !sec.customTreeOverride) {
        return NextResponse.json(
          {
            success: false,
            error: `Publish blocked: Section "${key}" (ID: ${sec.id}) definition not found in section registry.`,
          },
          { status: 400 }
        );
      }
    }

    // 2. Create Atomic Published Snapshot
    const newVersion = (page.version || 1) + 1;
    const snapshot = {
      version: newVersion,
      title: page.title,
      slug: page.slug,
      sections: page.sections,
      seo: page.seo,
      themeId: page.themeId,
      publishedAt: new Date(),
    };

    page.version = newVersion;
    page.status = 'published';
    page.isPublished = true;
    page.publishedSnapshot = snapshot;

    // Append to version history (keep last 30 snapshots)
    const history = page.versionHistory || [];
    history.unshift({
      version: newVersion,
      publishedAt: new Date(),
      publishedBy: user.userId as any,
      snapshot,
      note: `Atomic deployment to production (v${newVersion})`,
    });
    page.versionHistory = history.slice(0, 30);

    await page.save();

    // 3. Log Audit Event
    await logAuditEvent({
      action: 'cms.page.published',
      resource: 'cms_page',
      resourceId: page._id.toString(),
      severity: 'medium',
      details: {
        title: page.title,
        slug: page.slug,
        version: newVersion,
        sectionsCount: sections.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Page "${page.title}" atomically published as version v${newVersion}`,
      page,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
