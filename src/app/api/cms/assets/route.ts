import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsAsset } from '@/models/CmsAsset';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const fileType = searchParams.get('fileType');
  const search = searchParams.get('search');

  try {
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;
    if (fileType && fileType !== 'all') filter.fileType = fileType;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { filename: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const assets = await CmsAsset.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, assets });
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
    const { title, filename, url, storageProvider, fileType, mimeType, sizeBytes, dimensions, altText, caption, category, tags } = body;

    if (!filename || !url || !fileType) {
      return NextResponse.json({ success: false, error: 'Filename, url, and fileType are required' }, { status: 400 });
    }

    const asset = await CmsAsset.create({
      title: title || filename,
      filename,
      url,
      storageProvider: storageProvider || 'local',
      fileType,
      mimeType: mimeType || '',
      sizeBytes: sizeBytes || 0,
      dimensions: dimensions || {},
      altText: altText || '',
      caption: caption || '',
      category: category || 'general',
      tags: tags || [],
      createdBy: user.userId,
    });

    return NextResponse.json({ success: true, asset }, { status: 201 });
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
    return NextResponse.json({ success: false, error: 'Asset ID required' }, { status: 400 });
  }

  try {
    await CmsAsset.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Asset deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
