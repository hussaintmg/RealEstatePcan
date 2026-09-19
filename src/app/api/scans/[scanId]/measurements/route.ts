import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { CalibrationService } from '@/lib/scanning/calibrationService';
import { CalibrationReference } from '@/models/CalibrationReference';
import { ScanService } from '@/lib/scanning/scanService';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_measurements');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);
    const calib = await CalibrationReference.findOne({ scanId: scan._id });

    return NextResponse.json({
      success: true,
      data: {
        scaleFactor: calib ? calib.scaleFactor : 1.0,
        measurements: calib ? calib.measurements : [],
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_measurements');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { name, startPoint, endPoint, roomId } = body;

    if (!startPoint || !endPoint) {
      return NextResponse.json(
        { success: false, error: 'Must provide startPoint and endPoint {x, y, z}' },
        { status: 400 }
      );
    }

    const measurement = await CalibrationService.addMeasurement(
      params.scanId,
      { name: name || 'Measurement', startPoint, endPoint, roomId },
      authRes.user
    );

    return NextResponse.json(
      {
        success: true,
        data: measurement,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
