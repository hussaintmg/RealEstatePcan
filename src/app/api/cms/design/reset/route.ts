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

    if (!can(auth.user, auth.role, 'cms.design')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to reset design' }, { status: 403 });
    }

    const { target } = await req.json(); // 'theme' | 'layouts' | 'typography' | 'all'

    await connectToDatabase();

    const config = await CmsDesignConfig.findOne({ siteKey: 'default' });
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    if (target === 'theme' || target === 'all') {
      config.themeOverrides = { colors: {}, metrics: {}, typography: {} };
      config.activeThemeKey = 'luxury-dark';
    }

    if (target === 'layouts' || target === 'all') {
      config.publicLayouts = {
        topbarKey: 'topbar-minimal-centered',
        mobileNavKey: 'mob-drawer-left',
        footerKey: 'footer-large-editorial',
        stickyNav: true,
        searchEnabled: true,
        ctaText: 'Book VIP Viewing',
        ctaUrl: '/#contact',
      };
      config.dashboardLayouts = {
        topbarKey: 'dash-topbar-command-bar',
        sidebarKey: 'dash-sidebar-classic-grouped',
        shellKey: 'shell-standard-enterprise',
      };
    }

    if (target === 'typography' || target === 'all') {
      config.typography = {
        pairingId: 'luxury-editorial',
        headingFont: "'Cormorant Garamond', serif",
        bodyFont: "'Inter', sans-serif",
        uiFont: "'Inter', sans-serif",
        fluidScaleFactor: 1.0,
      };
    }

    config.status = 'draft';
    config.updatedBy = auth.user.userId as any;
    await config.save();

    clearPublicDesignCache();

    await recordAuditEvent({
      actorUserId: auth.user.userId,
      actorEmail: auth.user.email || 'staff@system.local',
      action: 'cms.design.updated',
      resourceType: 'CmsDesignConfig',
      resourceId: config._id.toString(),
      details: { resetTarget: target },
      status: 200,
      route: req.nextUrl.pathname,
      method: req.method,
    });

    return NextResponse.json({
      success: true,
      message: `Reset ${target} settings to system defaults successfully`,
      config,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset CMS design' }, { status: 500 });
  }
}
