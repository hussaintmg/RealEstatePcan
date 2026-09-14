import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsTheme } from '@/models/CmsTheme';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  try {
    let theme = await CmsTheme.findOne({ isDefault: true }).lean();
    if (!theme) {
      theme = await CmsTheme.findOne({}).lean();
    }

    if (!theme) {
      // Default fallback theme
      theme = {
        name: 'Aura Signature Dark Luxury',
        slug: 'default-luxury',
        isDefault: true,
        brand: {
          companyName: 'Aura Heights Luxury Estates',
          tagline: 'Architectural 3D Living Spaces',
          logoPrimary: '',
          logoDark: '',
          logoLight: '',
          logoMobile: '',
          favicon: '/favicon.ico',
          appIcon: '',
          footerLogo: '',
          authLogo: '',
          phone: '+92 (51) 880-9911',
          email: 'concierge@auraheights.local',
          address: 'Margalla Hillside Avenue, Sector F-7, Islamabad',
        },
        colors: {
          primary: '#3b82f6',
          secondary: '#6366f1',
          accent: '#10b981',
          background: '#0a0d14',
          surface: '#101522',
          text: '#ffffff',
          textMuted: '#94a3b8',
          border: 'rgba(255, 255, 255, 0.1)',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
        fonts: {
          headingFont: 'Inter, sans-serif',
          bodyFont: 'Inter, sans-serif',
          navigationFont: 'Inter, sans-serif',
          buttonFont: 'Inter, sans-serif',
        },
        scales: {
          borderRadius: '0.75rem',
          spacingScale: '1rem',
          shadowPreset: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          containerMaxWidth: '1280px',
        },
      } as any;
    }

    return NextResponse.json({ success: true, theme });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  try {
    const body = await req.json();
    const { name, slug, brand, colors, fonts, scales, isDefault, customCss } = body;

    const themeSlug = slug || 'default-luxury';

    const updatedTheme = await CmsTheme.findOneAndUpdate(
      { slug: themeSlug },
      {
        name: name || 'Aura Signature Dark Luxury',
        slug: themeSlug,
        brand: brand || {},
        colors: colors || {},
        fonts: fonts || {},
        scales: scales || {},
        isDefault: isDefault ?? true,
        customCss: customCss || '',
        createdBy: user.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, theme: updatedTheme });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
