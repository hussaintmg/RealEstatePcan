import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsDesignConfig } from '@/models/CmsDesignConfig';
import { getAuthContext } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { isFeatureEnabled } from '@/lib/features';
import { recordAuditEvent } from '@/lib/auditLogger';
import { SYSTEM_THEMES } from '@/lib/cms/design/themes';
import { FONT_REGISTRY } from '@/lib/cms/design/fonts';
import { CURATED_FONT_PAIRINGS } from '@/lib/cms/design/typography';
import { PUBLIC_TOPBAR_TEMPLATES } from '@/lib/cms/design/publicTopbars';
import { MOBILE_NAV_TEMPLATES } from '@/lib/cms/design/mobileNavs';
import { PUBLIC_FOOTER_TEMPLATES } from '@/lib/cms/design/publicFooters';
import {
  DASHBOARD_TOPBAR_TEMPLATES,
  DASHBOARD_SIDEBAR_TEMPLATES,
  DASHBOARD_SHELL_TEMPLATES,
} from '@/lib/cms/design/dashboardLayouts';
import { SKELETON_TEMPLATES } from '@/lib/cms/design/skeletons';
import { ANIMATION_REGISTRY } from '@/lib/cms/design/animations';
import { HOVER_EFFECT_REGISTRY } from '@/lib/cms/design/hoverEffects';
import { AUTH_PAGE_TEMPLATES } from '@/lib/cms/design/authTemplates';
import { FORM_LAYOUT_TEMPLATES } from '@/lib/cms/design/forms';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFeatureEnabled('cms')) {
      return NextResponse.json({ error: 'CMS feature is disabled' }, { status: 403 });
    }

    if (!can(auth.user, auth.role, 'cms.access')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to access CMS' }, { status: 403 });
    }

    await connectToDatabase();

    let config = await CmsDesignConfig.findOne({ siteKey: 'default' });
    if (!config) {
      config = await CmsDesignConfig.create({ siteKey: 'default' });
    }

    return NextResponse.json({
      success: true,
      config,
      registries: {
        themes: SYSTEM_THEMES.map((t) => ({ key: t.key, name: t.name, category: t.category, mode: t.mode, description: t.description })),
        fonts: FONT_REGISTRY.map((f) => ({ key: f.key, name: f.name, category: f.category, family: f.family })),
        pairings: CURATED_FONT_PAIRINGS,
        topbars: PUBLIC_TOPBAR_TEMPLATES.map((t) => ({ key: t.key, name: t.name, category: t.category, description: t.description })),
        mobileNavs: MOBILE_NAV_TEMPLATES.map((m) => ({ key: m.key, name: m.name, category: m.category, description: m.description })),
        footers: PUBLIC_FOOTER_TEMPLATES.map((f) => ({ key: f.key, name: f.name, category: f.category, description: f.description })),
        dashTopbars: DASHBOARD_TOPBAR_TEMPLATES.map((d) => ({ key: d.key, name: d.name, category: d.category, description: d.description })),
        dashSidebars: DASHBOARD_SIDEBAR_TEMPLATES.map((s) => ({ key: s.key, name: s.name, category: s.category, description: s.description })),
        dashShells: DASHBOARD_SHELL_TEMPLATES,
        skeletons: SKELETON_TEMPLATES.map((s) => ({ key: s.key, name: s.name, category: s.category, description: s.description })),
        animations: ANIMATION_REGISTRY.map((a) => ({ key: a.key, name: a.name, category: a.category, engine: a.engine, description: a.description })),
        hoverEffects: HOVER_EFFECT_REGISTRY.map((h) => ({ key: h.key, name: h.name, category: h.category, description: h.description })),
        authTemplates: AUTH_PAGE_TEMPLATES.map((a) => ({ key: a.key, name: a.name, type: a.type, description: a.description })),
        forms: FORM_LAYOUT_TEMPLATES.map((f) => ({ key: f.key, name: f.name, description: f.description })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch CMS design' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isFeatureEnabled('cms')) {
      return NextResponse.json({ error: 'CMS feature is disabled' }, { status: 403 });
    }

    if (!can(auth.user, auth.role, 'cms.design')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to modify design' }, { status: 403 });
    }

    const body = await req.json();

    // Security check: reject malicious script or executable injection
    const rawString = JSON.stringify(body);
    if (/<script|javascript:|onerror=|onload=/i.test(rawString)) {
      return NextResponse.json({ error: 'Security violation: executable scripts or malicious attributes are forbidden.' }, { status: 400 });
    }

    await connectToDatabase();

    let config = await CmsDesignConfig.findOne({ siteKey: 'default' });
    if (!config) {
      config = new CmsDesignConfig({ siteKey: 'default' });
    }

    // Update allowable fields
    if (body.activeThemeKey) config.activeThemeKey = body.activeThemeKey;
    if (body.themeMode) config.themeMode = body.themeMode;
    if (body.themeOverrides) {
      const getPlain = (val: any) => {
        if (!val) return {};
        if (val instanceof Map) return Object.fromEntries(val);
        if (typeof val === 'object') {
          const out: Record<string, any> = {};
          for (const [k, v] of Object.entries(val)) {
            if (!k.startsWith('$')) out[k] = v;
          }
          return out;
        }
        return {};
      };

      config.themeOverrides = {
        colors: { ...getPlain(config.themeOverrides?.colors), ...(body.themeOverrides.colors || {}) },
        metrics: { ...getPlain(config.themeOverrides?.metrics), ...(body.themeOverrides.metrics || {}) },
        typography: { ...getPlain(config.themeOverrides?.typography), ...(body.themeOverrides.typography || {}) },
      };
      config.markModified('themeOverrides');
    }
    if (body.publicLayouts) {
      config.publicLayouts = {
        topbarKey: body.publicLayouts.topbarKey || config.publicLayouts.topbarKey,
        mobileNavKey: body.publicLayouts.mobileNavKey || config.publicLayouts.mobileNavKey,
        footerKey: body.publicLayouts.footerKey || config.publicLayouts.footerKey,
        stickyNav: body.publicLayouts.stickyNav !== undefined ? body.publicLayouts.stickyNav : config.publicLayouts.stickyNav,
        searchEnabled: body.publicLayouts.searchEnabled !== undefined ? body.publicLayouts.searchEnabled : config.publicLayouts.searchEnabled,
        ctaText: body.publicLayouts.ctaText || config.publicLayouts.ctaText,
        ctaUrl: body.publicLayouts.ctaUrl || config.publicLayouts.ctaUrl,
      };
    }
    if (body.dashboardLayouts) {
      config.dashboardLayouts = {
        topbarKey: body.dashboardLayouts.topbarKey || config.dashboardLayouts.topbarKey,
        sidebarKey: body.dashboardLayouts.sidebarKey || config.dashboardLayouts.sidebarKey,
        shellKey: body.dashboardLayouts.shellKey || config.dashboardLayouts.shellKey,
      };
    }
    if (body.typography) {
      config.typography = {
        pairingId: body.typography.pairingId || config.typography.pairingId,
        headingFont: body.typography.headingFont || config.typography.headingFont,
        bodyFont: body.typography.bodyFont || config.typography.bodyFont,
        uiFont: body.typography.uiFont || config.typography.uiFont,
        fluidScaleFactor: body.typography.fluidScaleFactor !== undefined ? body.typography.fluidScaleFactor : config.typography.fluidScaleFactor,
      };
    }
    if (body.componentStyles) {
      config.componentStyles = {
        buttonRadius: body.componentStyles.buttonRadius || config.componentStyles.buttonRadius,
        cardBorder: body.componentStyles.cardBorder || config.componentStyles.cardBorder,
        inputStyle: body.componentStyles.inputStyle || config.componentStyles.inputStyle,
      };
    }
    if (body.forms?.layoutKey) config.forms.layoutKey = body.forms.layoutKey;
    if (body.skeletons) {
      config.skeletons = {
        activePattern: body.skeletons.activePattern || config.skeletons.activePattern,
        animation: body.skeletons.animation || config.skeletons.animation,
        speedMs: body.skeletons.speedMs || config.skeletons.speedMs,
      };
    }
    if (body.animations) {
      config.animations = {
        defaultEntrance: body.animations.defaultEntrance || config.animations.defaultEntrance,
        defaultHover: body.animations.defaultHover || config.animations.defaultHover,
        enableReducedMotion: body.animations.enableReducedMotion !== undefined ? body.animations.enableReducedMotion : config.animations.enableReducedMotion,
      };
    }
    if (body.authTemplates) {
      config.authTemplates = {
        loginKey: body.authTemplates.loginKey || config.authTemplates.loginKey,
        forgotPasswordKey: body.authTemplates.forgotPasswordKey || config.authTemplates.forgotPasswordKey,
        otpKey: body.authTemplates.otpKey || config.authTemplates.otpKey,
        resetPasswordKey: body.authTemplates.resetPasswordKey || config.authTemplates.resetPasswordKey,
      };
    }

    config.status = 'draft';
    config.updatedBy = auth.user.userId as any;
    await config.save();

    await recordAuditEvent({
      actorUserId: auth.user.userId,
      actorEmail: auth.user.email || 'staff@system.local',
      action: 'cms.design.updated',
      resourceType: 'CmsDesignConfig',
      resourceId: config._id.toString(),
      details: {
        activeTheme: config.activeThemeKey,
        topbar: config.publicLayouts.topbarKey,
        footer: config.publicLayouts.footerKey,
      },
      status: 200,
      route: req.nextUrl.pathname,
      method: req.method,
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save CMS design' }, { status: 500 });
  }
}
