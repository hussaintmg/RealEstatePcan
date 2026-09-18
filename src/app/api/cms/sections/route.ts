import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsSectionDefinition } from '@/models/CmsSectionDefinition';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { validateSectionDefinition } from '@/lib/cms/sdk/sectionValidator';
import { logAuditEvent } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  try {
    const customSections = await CmsSectionDefinition.find({}).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, sections: customSections });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
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

    // 1. Validate against Section SDK
    const validation = validateSectionDefinition(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Section definition validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // 2. Upsert custom section definition
    const existing = await CmsSectionDefinition.findOne({ key: body.key });
    let savedSection;

    if (existing) {
      Object.assign(existing, body);
      existing.updatedAt = new Date();
      savedSection = await existing.save();

      await logAuditEvent({
        action: 'cms.section.updated',
        resource: 'section',
        resourceId: savedSection._id.toString(),
        severity: 'low',
        details: { key: body.key, version: body.version },
      });
    } else {
      savedSection = await CmsSectionDefinition.create({
        ...body,
        createdBy: user.userId,
      });

      await logAuditEvent({
        action: 'cms.section.created',
        resource: 'section',
        resourceId: savedSection._id.toString(),
        severity: 'low',
        details: { key: body.key, version: body.version },
      });
    }

    return NextResponse.json({ success: true, section: savedSection });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
