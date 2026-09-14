import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsPage } from '@/models/CmsPage';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  try {
    if (slug) {
      let page = await CmsPage.findOne({ slug }).lean();
      if (!page) {
        // Return default skeleton for standard pages if not seeded
        page = {
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          slug,
          isPublished: true,
          metaTitle: `${slug.toUpperCase()} | Aura Heights Luxury Estates`,
          metaDescription: `Discover premier architectural developments and curated luxury living in ${slug}.`,
          sections: [
            {
              id: 'sec-hero',
              type: 'hero_video',
              title: 'Architectural Grandeur • Hero Scrubber',
              order: 1,
              isVisible: true,
              content: {
                badge: 'AURA SIGNATURE LIVING',
                heading: 'Sculpted Luxury Architecture',
                subheading: 'Experience panoramic hillscapes and bespoke contemporary villas designed for private living.',
                ctaText: 'Explore Estates',
                ctaUrl: '/properties',
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
              },
            },
            {
              id: 'sec-playcanvas',
              type: 'playcanvas_tour',
              title: 'PlayCanvas 3D Virtual Walkthrough',
              order: 2,
              isVisible: true,
              content: {
                badge: '3D WEBGL ENGINE',
                heading: 'Immersive Real-Time Walkthrough',
                subheading: 'Inspect fine Italian finishes, switch floors, and tour architectural suites in high-fidelity 3D.',
              },
            },
            {
              id: 'sec-featured',
              type: 'properties_grid',
              title: 'Curated Architectural Portfolio',
              order: 3,
              isVisible: true,
              content: {
                heading: 'Signature Estates',
                subheading: 'Handcrafted hillside villas, private penthouses, and premier estates.',
                limit: 6,
              },
            },
            {
              id: 'sec-consultation',
              type: 'lead_form',
              title: 'VIP Private Advisory Consultation',
              order: 4,
              isVisible: true,
              content: {
                heading: 'Schedule a Confidential Private Viewing',
                subheading: 'Our Senior Property Directors provide direct advisory for high-net-worth investors.',
              },
            },
          ],
        } as any;
      }
      return NextResponse.json({ success: true, page });
    }

    const pages = await CmsPage.find({}).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, pages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { slug, title, sections, isPublished, metaTitle, metaDescription } = body;

    if (!slug || !title) {
      return NextResponse.json({ success: false, error: 'Slug and title are required' }, { status: 400 });
    }

    const updatedPage = await CmsPage.findOneAndUpdate(
      { slug },
      {
        title,
        slug,
        sections: sections || [],
        isPublished: isPublished ?? true,
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        createdBy: user.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, page: updatedPage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
