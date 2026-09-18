import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
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
    const { targetVersion } = await req.json();

    if (!targetVersion) {
      return NextResponse.json({ success: false, error: 'targetVersion is required' }, { status: 400 });
    }

    const page = await CmsPage.findById(pageId);
    if (!page) {
      return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
    }

    // Find historical snapshot
    const targetHistory = (page.versionHistory || []).find((h: any) => h.version === targetVersion);
    if (!targetHistory || !targetHistory.snapshot) {
      return NextResponse.json(
        { success: false, error: `Version v${targetVersion} snapshot could not be found in history.` },
        { status: 404 }
      );
    }

    const snapshot = targetHistory.snapshot;
    const newVersion = (page.version || 1) + 1;

    // Restore snapshot state
    page.sections = snapshot.sections || [];
    page.seo = snapshot.seo || page.seo;
    page.themeId = snapshot.themeId || page.themeId;
    page.version = newVersion;
    page.status = 'published';
    page.isPublished = true;
    page.publishedSnapshot = {
      ...snapshot,
      version: newVersion,
      rolledBackFrom: targetVersion,
      publishedAt: new Date(),
    };

    // Record rollback in history
    page.versionHistory.unshift({
      version: newVersion,
      publishedAt: new Date(),
      publishedBy: user.userId as any,
      snapshot: page.publishedSnapshot,
      note: `Rolled back to version v${targetVersion}`,
    });

    await page.save();

    // Log security audit event
    await logAuditEvent({
      action: 'cms.page.rolled_back',
      resource: 'cms_page',
      resourceId: page._id.toString(),
      severity: 'medium',
      details: {
        title: page.title,
        fromVersion: page.version - 1,
        restoredVersion: targetVersion,
        newVersion,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Page successfully rolled back to v${targetVersion} (now published as v${newVersion})`,
      page,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
