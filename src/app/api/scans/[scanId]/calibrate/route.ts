import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { CalibrationService } from '@/lib/scanning/calibrationService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_measurements');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { point1, point2, knownDistanceMeters, referenceDistanceMeters, detectedDistanceUnits, referenceType, notes } = body;

    let calibration;

    // Two-point 3D calibration
    if (point1 && point2 && (knownDistanceMeters || referenceDistanceMeters)) {
      const dist = parseFloat(knownDistanceMeters || referenceDistanceMeters);
      calibration = await CalibrationService.calibrateWithTwoPoints(
        params.scanId,
        {
          point1,
          point2,
          knownDistanceMeters: dist,
          notes,
        },
        authRes.user
      );
    } else if (referenceDistanceMeters && detectedDistanceUnits) {
      calibration = await CalibrationService.calibrateScan(
        params.scanId,
        {
          referenceDistanceMeters: parseFloat(referenceDistanceMeters),
          detectedDistanceUnits: parseFloat(detectedDistanceUnits),
          referenceType: referenceType || 'user_dimension',
          notes,
        },
        authRes.user
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error:
            'Must provide either two reference 3D points ({point1, point2, knownDistanceMeters}) or {referenceDistanceMeters, detectedDistanceUnits}',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: calibration,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
