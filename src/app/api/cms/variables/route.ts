import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsVariable } from '@/models/CmsVariable';
import { discoverModelVariables } from '@/lib/cms/modelDiscovery';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  try {
    const discovered = discoverModelVariables();
    const customVariables = await CmsVariable.find({ isEnabled: true }).lean();

    const formattedCustom = customVariables.map((cv) => ({
      key: cv.key,
      label: cv.label,
      model: 'Custom',
      category: cv.category || 'Custom Variables',
      type: cv.type,
      sampleValue: cv.value,
      source: cv.source,
      description: cv.description || 'Custom administrator variable',
    }));

    const allVariables = [...discovered, ...formattedCustom];
    return NextResponse.json({ success: true, variables: allVariables });
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
    const { key, label, category, type, value, source, description } = body;

    if (!key || !label) {
      return NextResponse.json({ success: false, error: 'Key and Label are required' }, { status: 400 });
    }

    const variable = await CmsVariable.findOneAndUpdate(
      { key },
      {
        key,
        label,
        category: category || 'Custom',
        type: type || 'string',
        value: value ?? '',
        source: source || 'static',
        description: description || '',
        isEnabled: true,
        createdBy: user.userId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, variable });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
