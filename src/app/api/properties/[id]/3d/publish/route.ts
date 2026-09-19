import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Property3DExperience } from '@/models/Property3DExperience';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, can } from '@/lib/rbac';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { recordAudit } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gateCheck = await verifyFeatureAllowed('playcanvas3d');
  if (gateCheck) return gateCheck;

  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const role = await getUserRole(user.roleId);
    if (!can(user, role, 'property3d.publish')) {
      return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.publish capability' }, { status: 403 });
    }

    const propertyId = params.id;
    const experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      return NextResponse.json({ success: false, error: '3D Experience not found' }, { status: 404 });
    }

    if (!experience.modelUrl && !experience.sourceAsset?.url) {
      return NextResponse.json({ success: false, error: 'Cannot publish 3D experience without an uploaded model' }, { status: 400 });
    }

    // 1. Snapshot current configuration into versions
    const versionSnapshot = {
      versionNumber: experience.currentVersion,
      publishedAt: new Date(),
      publishedBy: user.userId as any,
      modelUrl: experience.sourceAsset?.url || experience.modelUrl,
      modelMetadata: experience.modelMetadata,
      cameraSettings: experience.cameraSettings,
      sceneSettings: experience.sceneSettings,
      floorMappings: experience.floorMappings,
      unitMappings: experience.unitMappings,
      hotspots: experience.hotspots,
    };

    experience.versions.push(versionSnapshot as any);
    experience.isPublished = true;
    experience.status = 'published';
    experience.publishedVersion = experience.currentVersion;
    experience.updatedBy = user.userId as any;

    await experience.save();

    // 2. Record audit log
    await recordAudit({
      actorUserId: user.userId as any,
      action: '3d.version_published',
      resourceType: 'property_3d',
      resourceId: experience._id.toString(),
      status: 200,
      metadata: {
        propertyId,
        publishedVersion: experience.publishedVersion,
        floorsCount: experience.floorMappings.length,
        unitsCount: experience.unitMappings.length,
        hotspotsCount: experience.hotspots.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `3D Experience version ${experience.publishedVersion} successfully published.`,
      experience,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
