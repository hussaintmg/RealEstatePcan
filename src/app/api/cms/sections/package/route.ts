import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CmsSectionDefinition } from '@/models/CmsSectionDefinition';
import { importSectionPackage } from '@/lib/cms/packageManager';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  const gateCheck = await verifyFeatureAllowed('cms');
  if (gateCheck) return gateCheck;

  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { packageJson } = await req.json();

    if (!packageJson) {
      return NextResponse.json({ success: false, error: 'Missing packageJson payload' }, { status: 400 });
    }

    // Strictly validate package
    const importResult = importSectionPackage(packageJson);
    if (!importResult.success || !importResult.definition) {
      return NextResponse.json(
        { success: false, error: 'Section package validation failed', errors: importResult.errors },
        { status: 400 }
      );
    }

    const def = importResult.definition;

    // Persist into CmsSectionDefinition
    const existing = await CmsSectionDefinition.findOne({ key: def.key });
    let saved;

    if (existing) {
      Object.assign(existing, def);
      existing.updatedAt = new Date();
      saved = await existing.save();
    } else {
      saved = await CmsSectionDefinition.create({
        ...def,
        createdBy: user.userId,
      });
    }

    await logAuditEvent({
      action: 'cms.section.imported',
      resource: 'section',
      resourceId: saved._id.toString(),
      severity: 'medium',
      details: { key: def.key, version: def.version },
    });

    return NextResponse.json({ success: true, section: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
