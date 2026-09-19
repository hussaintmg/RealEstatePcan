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

    if (!can(auth.user, auth.role, 'cms.publish')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to publish CMS design' }, { status: 403 });
    }

    await connectToDatabase();

    const config = await CmsDesignConfig.findOne({ siteKey: 'default' });
    if (!config) {
      return NextResponse.json({ error: 'Design configuration not initialized' }, { status: 404 });
    }

    // Build immutable snapshot of active configuration
    const snapshot = {
      activeThemeKey: config.activeThemeKey,
      themeMode: config.themeMode,
      themeOverrides: config.themeOverrides,
      publicLayouts: config.publicLayouts,
      dashboardLayouts: config.dashboardLayouts,
      typography: config.typography,
      componentStyles: config.componentStyles,
      forms: config.forms,
      skeletons: config.skeletons,
      animations: config.animations,
      authTemplates: config.authTemplates,
    };

    const nextVersion = (config.currentVersion || 1) + 1;
    config.currentVersion = nextVersion;
    config.publishedVersion = nextVersion;
    config.status = 'published';

    config.versions.push({
      versionNumber: nextVersion,
      publishedAt: new Date(),
      publishedBy: auth.user.userId as any,
      snapshot,
      notes: `Published version ${nextVersion}`,
    });

    config.updatedBy = auth.user.userId as any;
    await config.save();

    // Invalidate public delivery in-memory cache
    clearPublicDesignCache();

    await recordAuditEvent({
      actorUserId: auth.user.userId,
      actorEmail: auth.user.email || 'staff@system.local',
      action: 'cms.design.published',
      resourceType: 'CmsDesignConfig',
      resourceId: config._id.toString(),
      details: {
        publishedVersion: nextVersion,
        activeTheme: config.activeThemeKey,
      },
      status: 200,
      route: req.nextUrl.pathname,
      method: req.method,
    });

    return NextResponse.json({
      success: true,
      message: `Design published successfully as version ${nextVersion}`,
      version: nextVersion,
      config,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to publish CMS design' }, { status: 500 });
  }
}
