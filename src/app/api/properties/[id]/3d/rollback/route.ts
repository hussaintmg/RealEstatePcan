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
    if (!can(user, role, 'property3d.rollback')) {
      return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.rollback capability' }, { status: 403 });
    }

    const propertyId = params.id;
    const body = await req.json();
    const targetVersion = typeof body.targetVersion === 'number' ? body.targetVersion : parseInt(body.targetVersion, 10);

    if (isNaN(targetVersion)) {
      return NextResponse.json({ success: false, error: 'Valid targetVersion integer required' }, { status: 400 });
    }

    const experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      return NextResponse.json({ success: false, error: '3D Experience not found' }, { status: 404 });
    }

    const snapshot = experience.versions.find((v) => v.versionNumber === targetVersion);
    if (!snapshot) {
      return NextResponse.json({
        success: false,
        error: `No snapshot found for version ${targetVersion}. Available versions: ${experience.versions.map((v) => v.versionNumber).join(', ')}`,
      }, { status: 404 });
    }

    // Restore configuration from snapshot
    experience.modelUrl = snapshot.modelUrl;
    if (snapshot.modelMetadata) experience.modelMetadata = snapshot.modelMetadata;
    if (snapshot.cameraSettings) experience.cameraSettings = snapshot.cameraSettings;
    if (snapshot.sceneSettings) experience.sceneSettings = snapshot.sceneSettings;
    if (Array.isArray(snapshot.floorMappings)) experience.floorMappings = snapshot.floorMappings;
    if (Array.isArray(snapshot.unitMappings)) experience.unitMappings = snapshot.unitMappings;
    if (Array.isArray(snapshot.hotspots)) experience.hotspots = snapshot.hotspots;

    experience.publishedVersion = targetVersion;
    experience.status = 'published';
    experience.isPublished = true;
    experience.updatedBy = user.userId as any;

    await experience.save();

    await recordAudit({
      actorUserId: user.userId as any,
      action: '3d.version_rolled_back',
      resourceType: 'property_3d',
      resourceId: experience._id.toString(),
      status: 200,
      metadata: {
        propertyId,
        rolledBackToVersion: targetVersion,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion}`,
      experience,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
