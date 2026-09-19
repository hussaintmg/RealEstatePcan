import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Property3DExperience } from '@/models/Property3DExperience';
import { Property } from '@/models/Property';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, can } from '@/lib/rbac';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { recordAudit } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(
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
    if (!can(user, role, 'property3d.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.view capability' }, { status: 403 });
    }

    const propertyId = params.id;
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    let experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      // Default scaffold
      experience = new Property3DExperience({
        propertyId,
        title: `${property.title} 3D Experience`,
        status: 'ready',
        modelUrl: property.model3dUrl || '',
        format: 'glb',
        isPublished: false,
        cameraSettings: {
          defaultPosition: [0, 3, 7],
          defaultTarget: [0, 1, 0],
          fov: 55,
          minDistance: 1,
          maxDistance: 60,
          minPitch: -10,
          maxPitch: 85,
        },
        sceneSettings: {
          rootTransform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          environmentPreset: 'golden_hour',
          exposure: 1.0,
          ambientIntensity: 0.6,
          shadowQuality: 'medium',
        },
        bookmarks: [],
        hotspots: [],
        floorMappings: [],
        unitMappings: [],
        createdBy: user.userId,
      });
      await experience.save();
    }

    return NextResponse.json({
      success: true,
      experience,
      property: {
        _id: property._id,
        title: property.title,
        price: property.price,
        location: property.location,
        specs: property.specs,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
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
    if (!can(user, role, 'property3d.edit')) {
      return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.edit capability' }, { status: 403 });
    }

    const propertyId = params.id;
    const body = await req.json();

    let experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 });
    }

    // Check mapping permission if mapping changed
    if (body.floorMappings || body.unitMappings) {
      if (!can(user, role, 'property3d.map')) {
        return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.map capability' }, { status: 403 });
      }
    }

    const wasCameraChanged = JSON.stringify(body.cameraSettings) !== JSON.stringify(experience.cameraSettings);
    const wasMappingChanged =
      JSON.stringify(body.floorMappings) !== JSON.stringify(experience.floorMappings) ||
      JSON.stringify(body.unitMappings) !== JSON.stringify(experience.unitMappings);
    const wasHotspotsChanged = JSON.stringify(body.hotspots) !== JSON.stringify(experience.hotspots);

    if (body.title !== undefined) experience.title = body.title;
    if (body.modelUrl !== undefined) experience.modelUrl = body.modelUrl;

    if (body.sceneSettings) {
      if (body.sceneSettings.rootTransform) experience.sceneSettings.rootTransform = body.sceneSettings.rootTransform;
      if (body.sceneSettings.environmentPreset) experience.sceneSettings.environmentPreset = body.sceneSettings.environmentPreset;
      if (typeof body.sceneSettings.exposure === 'number') experience.sceneSettings.exposure = body.sceneSettings.exposure;
      if (typeof body.sceneSettings.ambientIntensity === 'number') experience.sceneSettings.ambientIntensity = body.sceneSettings.ambientIntensity;
      if (body.sceneSettings.shadowQuality) experience.sceneSettings.shadowQuality = body.sceneSettings.shadowQuality;
    }

    if (body.cameraSettings) {
      if (body.cameraSettings.defaultPosition) experience.cameraSettings.defaultPosition = body.cameraSettings.defaultPosition;
      if (body.cameraSettings.defaultTarget) experience.cameraSettings.defaultTarget = body.cameraSettings.defaultTarget;
      if (typeof body.cameraSettings.fov === 'number') experience.cameraSettings.fov = body.cameraSettings.fov;
      if (typeof body.cameraSettings.minDistance === 'number') experience.cameraSettings.minDistance = body.cameraSettings.minDistance;
      if (typeof body.cameraSettings.maxDistance === 'number') experience.cameraSettings.maxDistance = body.cameraSettings.maxDistance;
      if (typeof body.cameraSettings.minPitch === 'number') experience.cameraSettings.minPitch = body.cameraSettings.minPitch;
      if (typeof body.cameraSettings.maxPitch === 'number') experience.cameraSettings.maxPitch = body.cameraSettings.maxPitch;
    }

    if (body.bookmarks !== undefined) experience.bookmarks = body.bookmarks;
    if (body.hotspots !== undefined) experience.hotspots = body.hotspots;
    if (body.floorMappings !== undefined) experience.floorMappings = body.floorMappings;
    if (body.unitMappings !== undefined) experience.unitMappings = body.unitMappings;
    if (body.previewImageUrl !== undefined) experience.previewImageUrl = body.previewImageUrl;

    experience.updatedBy = user.userId as any;
    await experience.save();

    // Audit logs for specific mutations
    if (wasCameraChanged) {
      await recordAudit({
        actorUserId: user.userId as any,
        action: '3d.camera_updated',
        resourceType: 'property_3d',
        resourceId: experience._id.toString(),
        status: 200,
        metadata: { propertyId, cameraSettings: experience.cameraSettings },
      });
    }

    if (wasMappingChanged) {
      await recordAudit({
        actorUserId: user.userId as any,
        action: '3d.mapping_updated',
        resourceType: 'property_3d',
        resourceId: experience._id.toString(),
        status: 200,
        metadata: {
          propertyId,
          floorsCount: experience.floorMappings.length,
          unitsCount: experience.unitMappings.length,
        },
      });
    }

    if (wasHotspotsChanged) {
      await recordAudit({
        actorUserId: user.userId as any,
        action: '3d.hotspot_created',
        resourceType: 'property_3d',
        resourceId: experience._id.toString(),
        status: 200,
        metadata: { propertyId, hotspotsCount: experience.hotspots.length },
      });
    }

    return NextResponse.json({ success: true, experience });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  // Delegate POST to PUT for uniform updates
  return PUT(req, ctx);
}
