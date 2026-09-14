import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { Template } from '@/models/Template';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  const featureCheck = await verifyFeatureAllowed('templateEditors');
  if (featureCheck) return featureCheck;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const type = req.nextUrl.searchParams.get('type');
  const query: any = {};
  if (type) query.type = type;

  const templates = await Template.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, templates });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const featureCheck = await verifyFeatureAllowed('templateEditors');
  if (featureCheck) return featureCheck;

  const user = await getSessionUser();
  if (!user || (!user.isDeveloper && !user.isOwner)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
  }

  await connectToDatabase();
  const body = await req.json();

  try {
    const template = await Template.create({
      ...body,
      createdBy: user.userId,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/templates',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
