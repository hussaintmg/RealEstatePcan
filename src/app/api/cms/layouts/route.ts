import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsLayout } from '@/models/CmsLayout';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const slug = searchParams.get('slug');
  const isDefault = searchParams.get('isDefault');

  try {
    const filter: any = {};
    if (type) filter.type = type;
    if (slug) filter.slug = slug;
    if (isDefault === 'true') filter.isDefault = true;

    if (slug) {
      const layout = await CmsLayout.findOne(filter).lean();
      return NextResponse.json({ success: true, layout });
    }

    const layouts = await CmsLayout.find(filter).sort({ isDefault: -1, updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, layouts });
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
    const { type, title, slug, templateVariant, isDefault, targetArea, content, styling } = body;

    if (!type || !title || !slug) {
      return NextResponse.json({ success: false, error: 'Type, title, and slug are required' }, { status: 400 });
    }

    // If marked as default, unset other defaults for the same type
    if (isDefault) {
      await CmsLayout.updateMany({ type }, { $set: { isDefault: false } });
    }

    const layout = await CmsLayout.findOneAndUpdate(
      { slug },
      {
        type,
        title,
        slug,
        templateVariant: templateVariant || 'default',
        isDefault: Boolean(isDefault),
        targetArea: targetArea || 'public',
        content: content || {},
        styling: styling || {},
        createdBy: user.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, layout });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Layout ID required' }, { status: 400 });
  }

  try {
    await CmsLayout.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Layout deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
