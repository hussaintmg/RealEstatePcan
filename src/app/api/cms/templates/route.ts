import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsTemplate } from '@/models/CmsTemplate';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const templateType = searchParams.get('templateType');

  try {
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;
    if (templateType && templateType !== 'all') filter.templateType = templateType;

    const templates = await CmsTemplate.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, templates });
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
    const { name, slug, category, description, thumbnailUrl, templateType, schemaData, isSystemPreset } = body;

    if (!name || !templateType || !schemaData) {
      return NextResponse.json({ success: false, error: 'Name, templateType, and schemaData are required' }, { status: 400 });
    }

    const templateSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const template = await CmsTemplate.findOneAndUpdate(
      { slug: templateSlug },
      {
        name,
        slug: templateSlug,
        category: category || 'general',
        description: description || '',
        thumbnailUrl: thumbnailUrl || '',
        templateType,
        schemaData,
        isSystemPreset: Boolean(isSystemPreset),
        version: 1,
        createdBy: user.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, template });
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
    return NextResponse.json({ success: false, error: 'Template ID required' }, { status: 400 });
  }

  try {
    await CmsTemplate.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
