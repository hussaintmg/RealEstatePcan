import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsDesignConfig } from '@/models/CmsDesignConfig';
import { getAuthContext } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { isFeatureEnabled } from '@/lib/features';
import { recordAuditEvent } from '@/lib/auditLogger';
import { clearPublicDesignCache } from '@/lib/cms/design/cache';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFeatureEnabled('cms')) {
      return NextResponse.json({ error: 'CMS feature is disabled' }, { status: 403 });
    }

    if (!can(auth.user, auth.role, 'cms.rollback')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to rollback design' }, { status: 403 });
    }

    const { targetVersion } = await req.json();
    if (!targetVersion || typeof targetVersion !== 'number') {
      return NextResponse.json({ error: 'targetVersion number is required' }, { status: 400 });
    }

    await connectToDatabase();

    const config = await CmsDesignConfig.findOne({ siteKey: 'default' });
    if (!config) {
      return NextResponse.json({ error: 'Design configuration not found' }, { status: 404 });
    }

    const snapshotRecord = config.versions.find((v) => v.versionNumber === targetVersion);
    if (!snapshotRecord) {
      return NextResponse.json({ error: `Snapshot for version ${targetVersion} not found in history` }, { status: 404 });
    }

    const snap = snapshotRecord.snapshot;

    // Restore properties from snapshot
    if (snap.activeThemeKey) config.activeThemeKey = snap.activeThemeKey;
    if (snap.themeMode) config.themeMode = snap.themeMode;
    if (snap.themeOverrides) config.themeOverrides = snap.themeOverrides;
    if (snap.publicLayouts) config.publicLayouts = snap.publicLayouts;
    if (snap.dashboardLayouts) config.dashboardLayouts = snap.dashboardLayouts;
    if (snap.typography) config.typography = snap.typography;
    if (snap.componentStyles) config.componentStyles = snap.componentStyles;
    if (snap.forms) config.forms = snap.forms;
    if (snap.skeletons) config.skeletons = snap.skeletons;
    if (snap.animations) config.animations = snap.animations;
    if (snap.authTemplates) config.authTemplates = snap.authTemplates;

    const nextVersion = (config.currentVersion || 1) + 1;
    config.currentVersion = nextVersion;
    config.publishedVersion = nextVersion;
    config.status = 'published';

    config.versions.push({
      versionNumber: nextVersion,
      publishedAt: new Date(),
      publishedBy: auth.user.userId as any,
      snapshot: snap,
      notes: `Rolled back to version ${targetVersion}`,
    });

    config.updatedBy = auth.user.userId as any;
    await config.save();

    clearPublicDesignCache();

    await recordAuditEvent({
      actorUserId: auth.user.userId,
      actorEmail: auth.user.email || 'staff@system.local',
      action: 'cms.design.rolled_back',
      resourceType: 'CmsDesignConfig',
      resourceId: config._id.toString(),
      details: {
        revertedToVersion: targetVersion,
        newActiveVersion: nextVersion,
      },
      status: 200,
      route: req.nextUrl.pathname,
      method: req.method,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back design to version ${targetVersion}`,
      version: nextVersion,
      config,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to rollback CMS design' }, { status: 500 });
  }
}
