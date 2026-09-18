import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Property3DExperience } from '@/models/Property3DExperience';
import { Property } from '@/models/Property';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const gateCheck = await verifyFeatureAllowed('playcanvas3d');
  if (gateCheck) return gateCheck;

  try {
    await connectToDatabase();
    const propertyId = params.id;

    let experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      // Find property to get title
      const property = await Property.findById(propertyId);
      if (!property) {
        return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
      }

      // Return default experience scaffold
      return NextResponse.json({
        success: true,
        experience: {
          propertyId,
          title: `${property.title} 3D Experience`,
          modelUrl: property.model3dUrl || '',
          format: 'glb',
          isPublished: true,
          initialCameraPos: [0, 3, 7],
          initialLookAt: [0, 1, 0],
          hotspots: [],
          waypoints: [],
          floorMappings: [],
          unitMappings: [],
          lightingPreset: 'golden_hour',
        },
        isNew: true,
      });
    }

    return NextResponse.json({ success: true, experience });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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
    const propertyId = params.id;
    const body = await req.json();

    let experience = await Property3DExperience.findOne({ propertyId });
    if (!experience) {
      experience = new Property3DExperience({
        propertyId,
        createdBy: user.userId,
        ...body,
      });
    } else {
      Object.assign(experience, body);
    }

    await experience.save();

    // If modelUrl changed, also sync to Property record
    if (body.modelUrl) {
      await Property.findByIdAndUpdate(propertyId, { model3dUrl: body.modelUrl });
    }

    return NextResponse.json({ success: true, experience });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
