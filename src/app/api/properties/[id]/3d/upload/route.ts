import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { connectToDatabase } from '@/lib/db';
import { Property3DExperience } from '@/models/Property3DExperience';
import { Property } from '@/models/Property';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, can } from '@/lib/rbac';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { validateAndInspectGlb, checkMappingCompatibility } from '@/lib/3d/glbPipeline';
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
    if (!can(user, role, 'property3d.upload')) {
      return NextResponse.json({ success: false, error: 'Forbidden: missing property3d.upload capability' }, { status: 403 });
    }

    const propertyId = params.id;
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No 3D model file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Validate and inspect GLB server-side
    const inspection = validateAndInspectGlb(buffer, file.name);
    if (!inspection.valid || !inspection.metadata) {
      return NextResponse.json({ success: false, error: inspection.error || 'Invalid 3D model container' }, { status: 400 });
    }

    // 2. Persist GLB file safely using ScanStorageAdapter (Supabase cloud or local fallback)
    const storageKey = `models/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { ScanStorageAdapter } = await import('@/lib/scanning/storageAdapter');
    await ScanStorageAdapter.saveFile(storageKey, buffer, 'model/gltf-binary');

    const storageConfig = await ScanStorageAdapter.getStorageConfig();
    let publicUrl = `/uploads/${storageKey}`;
    if (storageConfig.provider === 'supabase' && storageConfig.supabaseUrl) {
      const { createClient } = await import('@supabase/supabase-js');
      const keyToUse = storageConfig.serviceKey || storageConfig.anonKey;
      const supabase = createClient(storageConfig.supabaseUrl, keyToUse);
      const { data } = supabase.storage.from(storageConfig.bucket).getPublicUrl(storageKey);
      if (data?.publicUrl) {
        publicUrl = data.publicUrl;
      }
    } else {
      try {
        const localPath = path.join(process.cwd(), 'public', 'uploads', storageKey);
        await fs.mkdir(path.dirname(localPath), { recursive: true });
        await fs.writeFile(localPath, buffer);
      } catch {}
    }

    // 3. Find or initialize Property3DExperience
    let experience = await Property3DExperience.findOne({ propertyId });
    let isNew = false;
    let compatibility: any = null;

    if (!experience) {
      isNew = true;
      experience = new Property3DExperience({
        propertyId,
        title: `${property.title} 3D Experience`,
        status: 'ready',
        currentVersion: 1,
        sourceAsset: {
          url: publicUrl,
          fileName: file.name,
          fileSizeBytes: buffer.length,
          storageKey,
          uploadedAt: new Date(),
        },
        modelUrl: publicUrl,
        format: 'glb',
        modelMetadata: inspection.metadata,
        cameraSettings: {
          defaultPosition: inspection.autoFraming?.recommendedPosition || [0, 3, 7],
          defaultTarget: inspection.autoFraming?.recommendedTarget || [0, 1, 0],
          fov: inspection.autoFraming?.recommendedFov || 55,
          minDistance: 1,
          maxDistance: 60,
          minPitch: -10,
          maxPitch: 85,
        },
        createdBy: user.userId,
      });
    } else {
      // Model Replacement: Check existing mappings against new named nodes
      const allExistingMappings = [
        ...experience.floorMappings.map((m) => ({ nodeName: m.nodeName })),
        ...experience.unitMappings.map((m) => ({ nodeName: m.nodeName })),
      ];

      compatibility = checkMappingCompatibility(
        inspection.metadata.namedNodes,
        allExistingMappings
      );

      experience.currentVersion += 1;
      experience.status = compatibility.missing.length > 0 ? 'configuration_required' : 'ready';
      experience.sourceAsset = {
        url: publicUrl,
        fileName: file.name,
        fileSizeBytes: buffer.length,
        storageKey,
        uploadedAt: new Date(),
      };
      experience.modelUrl = publicUrl;
      experience.modelMetadata = inspection.metadata;
      experience.updatedBy = user.userId as any;
    }

    await experience.save();

    // Sync model3dUrl to Property model
    await Property.findByIdAndUpdate(propertyId, { model3dUrl: publicUrl });

    // 4. Audit Log Events
    await recordAudit({
      actorUserId: user.userId as any,
      action: '3d.uploaded',
      resourceType: 'property_3d',
      resourceId: experience._id.toString(),
      status: 200,
      metadata: {
        propertyId,
        fileName: file.name,
        fileSize: buffer.length,
        nodeCount: inspection.metadata.nodeCount,
      },
    });

    await recordAudit({
      actorUserId: user.userId as any,
      action: '3d.processed',
      resourceType: 'property_3d',
      resourceId: experience._id.toString(),
      status: 200,
      metadata: {
        propertyId,
        triangleCount: inspection.metadata.triangleCount,
        meshCount: inspection.metadata.meshCount,
        boundingBox: inspection.metadata.boundingBox,
      },
    });

    return NextResponse.json({
      success: true,
      experience,
      compatibility,
      autoFraming: inspection.autoFraming,
      hierarchy: inspection.hierarchy,
    });
  } catch (err: any) {
    console.error('Error handling GLB upload:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
