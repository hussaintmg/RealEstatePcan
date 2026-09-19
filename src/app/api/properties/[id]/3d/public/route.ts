import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Property3DExperience } from '@/models/Property3DExperience';
import { Property } from '@/models/Property';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gateCheck = await verifyFeatureAllowed('playcanvas3d');
  if (gateCheck) return gateCheck;

  try {
    await connectToDatabase();
    const propertyId = params.id;

    // 1. Fetch Property record
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // 2. Fetch 3D Experience (must be published)
    const experience = await Property3DExperience.findOne({
      propertyId,
      isPublished: true,
      status: 'published',
    }).lean();

    if (!experience) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'No published 3D spatial experience available for this property.',
        },
        { status: 404 }
      );
    }

    // 3. Resolve live unit pricing and status from database entities
    const resolvedUnits = (experience.unitMappings || []).map((mapping) => {
      let liveStatus: 'available' | 'reserved' | 'sold' = (mapping.status as any) || 'available';
      let livePrice = mapping.price || 0;
      let liveBedrooms = mapping.bedrooms || 2;
      let liveBathrooms = mapping.bathrooms || 2;
      let liveArea = mapping.areaSqFt || 1200;

      // If the parent property has units or if property specs apply
      if (property.units && Array.isArray(property.units)) {
        const foundUnit = property.units.find(
          (u: any) =>
            u._id?.toString() === mapping.propertyUnitId ||
            u.id === mapping.propertyUnitId ||
            u.name === mapping.unitName ||
            u.unitNumber === mapping.unitName
        );
        if (foundUnit) {
          if (foundUnit.status) liveStatus = foundUnit.status.toLowerCase() as 'available' | 'reserved' | 'sold';
          if (foundUnit.price) livePrice = foundUnit.price;
          if (foundUnit.bedrooms) liveBedrooms = foundUnit.bedrooms;
          if (foundUnit.bathrooms) liveBathrooms = foundUnit.bathrooms;
          if (foundUnit.areaSqFt) liveArea = foundUnit.areaSqFt;
        }
      }

      return {
        id: mapping.id || mapping.nodeName,
        propertyUnitId: mapping.propertyUnitId,
        unitName: mapping.unitName || mapping.name || mapping.nodeName,
        nodeName: mapping.nodeName,
        nodePath: mapping.nodePath,
        price: livePrice,
        status: liveStatus,
        bedrooms: liveBedrooms,
        bathrooms: liveBathrooms,
        areaSqFt: liveArea,
        cameraBookmarkId: mapping.cameraBookmarkId,
        cameraPos: mapping.cameraPos,
        lookAt: mapping.lookAt,
      };
    });

    // 4. Return sanitized, public-safe data payload
    return NextResponse.json({
      success: true,
      available: true,
      experience: {
        title: experience.title,
        modelUrl: experience.sourceAsset?.url || experience.modelUrl,
        previewImageUrl: experience.previewImageUrl || property.featuredImage || '',
        publishedVersion: experience.publishedVersion || 1,
        cameraSettings: experience.cameraSettings || {
          defaultPosition: [0, 3, 7],
          defaultTarget: [0, 1, 0],
          fov: 55,
          minDistance: 1,
          maxDistance: 60,
          minPitch: -10,
          maxPitch: 85,
        },
        sceneSettings: experience.sceneSettings || {
          environmentPreset: 'golden_hour',
          exposure: 1.0,
          ambientIntensity: 0.6,
          shadowQuality: 'medium',
        },
        bookmarks: experience.bookmarks || [],
        floorMappings: experience.floorMappings || [],
        unitMappings: resolvedUnits,
        hotspots: (experience.hotspots || []).map((h) => ({
          id: h.id,
          type: h.type || 'info',
          title: h.title || h.label,
          label: h.label || h.title,
          description: h.description || h.content,
          specs: h.specs,
          position: h.position,
          targetLookAt: h.targetLookAt,
          targetEntityId: h.targetEntityId,
        })),
      },
      property: {
        id: property._id.toString(),
        title: property.title,
        price: property.price,
        location: property.location,
        specs: property.specs,
        status: property.status,
      },
    });
  } catch (err: any) {
    console.error('Error serving public 3D experience:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
