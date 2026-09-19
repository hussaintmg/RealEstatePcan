import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsDesignConfig } from '@/models/CmsDesignConfig';
import { isFeatureEnabled } from '@/lib/features';
import { resolveDesignTokens, tokensToCssVariables, tokensToCssString } from '@/lib/cms/design/tokenResolver';
import { buildGoogleFontsUrl, getFontByKey } from '@/lib/cms/design/fonts';
import { calculateFluidTypeScale } from '@/lib/cms/design/typography';
import { getCachedPublicDesign, setCachedPublicDesign } from '@/lib/cms/design/cache';

export async function GET(req: NextRequest) {
  try {
    if (!isFeatureEnabled('cms')) {
      return NextResponse.json({ error: 'CMS feature is disabled' }, { status: 403 });
    }

    const cached = getCachedPublicDesign();
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      });
    }

    await connectToDatabase();

    const config = await CmsDesignConfig.findOne({ siteKey: 'default' }).lean();

    const activeThemeKey = config?.activeThemeKey || 'luxury-dark';
    const overrides = config?.themeOverrides ? {
      colors: config.themeOverrides.colors instanceof Map ? Object.fromEntries(config.themeOverrides.colors) : config.themeOverrides.colors,
      metrics: config.themeOverrides.metrics instanceof Map ? Object.fromEntries(config.themeOverrides.metrics) : config.themeOverrides.metrics,
      typography: config.themeOverrides.typography instanceof Map ? Object.fromEntries(config.themeOverrides.typography) : config.themeOverrides.typography,
    } : undefined;

    const resolvedTokens = resolveDesignTokens(activeThemeKey, overrides);
    const cssVariables = tokensToCssVariables(resolvedTokens);
    const cssString = tokensToCssString(resolvedTokens, ':root');

    // Extract minimal font keys for Google Fonts link
    const headingFont = resolvedTokens.typography.headingFont || '';
    const bodyFont = resolvedTokens.typography.bodyFont || '';
    const fontsToLoad: string[] = [];

    if (/Cormorant Garamond/i.test(headingFont)) fontsToLoad.push('cormorant-garamond');
    if (/Playfair Display/i.test(headingFont)) fontsToLoad.push('playfair-display');
    if (/Cinzel/i.test(headingFont)) fontsToLoad.push('cinzel');
    if (/Space Grotesk/i.test(headingFont)) fontsToLoad.push('space-grotesk');
    if (/Syne/i.test(headingFont)) fontsToLoad.push('syne');
    if (/Newsreader/i.test(headingFont)) fontsToLoad.push('newsreader');
    if (/Bodoni/i.test(headingFont)) fontsToLoad.push('bodoni-moda');
    if (/Outfit/i.test(headingFont) || /Outfit/i.test(bodyFont)) fontsToLoad.push('outfit');
    if (/Plus Jakarta Sans/i.test(headingFont) || /Plus Jakarta Sans/i.test(bodyFont)) fontsToLoad.push('plus-jakarta-sans');
    if (/DM Sans/i.test(headingFont) || /DM Sans/i.test(bodyFont)) fontsToLoad.push('dm-sans');
    if (/Montserrat/i.test(headingFont) || /Montserrat/i.test(bodyFont)) fontsToLoad.push('montserrat');
    if (/Inter/i.test(headingFont) || /Inter/i.test(bodyFont)) fontsToLoad.push('inter');

    const googleFontsUrl = buildGoogleFontsUrl(fontsToLoad);
    const fluidType = calculateFluidTypeScale(config?.typography?.fluidScaleFactor || 1.0);

    const publicPayload = {
      success: true,
      activeThemeKey,
      themeMode: config?.themeMode || 'dark',
      version: config?.publishedVersion || config?.currentVersion || 1,
      publicLayouts: config?.publicLayouts || {
        topbarKey: 'topbar-minimal-centered',
        mobileNavKey: 'mob-drawer-left',
        footerKey: 'footer-large-editorial',
        stickyNav: true,
        searchEnabled: true,
        ctaText: 'Book VIP Viewing',
        ctaUrl: '/#contact',
      },
      typography: {
        headingFont: resolvedTokens.typography.headingFont,
        bodyFont: resolvedTokens.typography.bodyFont,
        uiFont: resolvedTokens.typography.uiFont,
        fluidType,
      },
      cssVariables,
      cssString,
      googleFontsUrl,
      animations: {
        defaultEntrance: config?.animations?.defaultEntrance || 'anim-reveal-up-subtle',
        defaultHover: config?.animations?.defaultHover || 'hover-lift-subtle',
        enableReducedMotion: config?.animations?.enableReducedMotion || false,
      },
      skeletons: {
        activePattern: config?.skeletons?.activePattern || 'skel-property-card',
        animation: config?.skeletons?.animation || 'shimmer',
        speedMs: config?.skeletons?.speedMs || 1500,
      },
      authTemplates: config?.authTemplates || {
        loginKey: 'auth-login-split-luxury',
        forgotPasswordKey: 'auth-forgot-centered',
        otpKey: 'auth-otp-centered-six-box',
        resetPasswordKey: 'auth-reset-secure-card',
      },
    };

    setCachedPublicDesign(publicPayload);

    return NextResponse.json(publicPayload, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch public design' }, { status: 500 });
  }
}
