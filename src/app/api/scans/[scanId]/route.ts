import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';
import { ScanRoom } from '@/models/ScanRoom';
import { ScanArtifact } from '@/models/ScanArtifact';
import { CalibrationReference } from '@/models/CalibrationReference';
import { ProcessingJob } from '@/models/ProcessingJob';
import { connectToDatabase } from '@/lib/db';

import { PropertyScan } from '@/models/PropertyScan';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();

    let scan: any = null;
    if (authRes.user) {
      scan = await ScanService.getScan(params.scanId, authRes.user);
    } else {
      // Unauthenticated visitor viewing a 3D tour
      if (mongoose.Types.ObjectId.isValid(params.scanId)) {
        scan = await PropertyScan.findById(params.scanId);
      }
      if (!scan) {
        scan = await PropertyScan.findOne({
          $or: [{ propertyId: params.scanId }, { _id: params.scanId }],
        }).sort({ createdAt: -1 });
      }
      if (!scan) {
        return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 });
      }
      // If scan is draft/failed and not public, require login
      if (!scan.isPublic && scan.status !== 'ready') {
        return authRes.error || NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
      }
    }

    const [rooms, artifacts, calibration, activeJob] = await Promise.all([
      ScanRoom.find({ scanId: scan._id }).sort({ assignedOrder: 1 }),
      ScanArtifact.find({ scanId: scan._id }).sort({ version: -1 }),
      CalibrationReference.findOne({ scanId: scan._id }),
      ProcessingJob.findOne({ scanId: scan._id }).sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        scan,
        rooms,
        artifacts,
        calibration,
        activeJob,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();

    if (body.status) {
      const updated = await ScanService.transitionScanState(
        params.scanId,
        body.status,
        authRes.user,
        body.reason
      );
      return NextResponse.json({ success: true, data: updated });
    }

    // Otherwise metadata update
    const scan = await ScanService.getScan(params.scanId, authRes.user);
    if (body.title) scan.title = body.title;
    if (typeof body.isPublic === 'boolean') scan.isPublic = body.isPublic;
    if (body.thumbnailUrl) scan.thumbnailUrl = body.thumbnailUrl;
    await scan.save();

    return NextResponse.json({ success: true, data: scan });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    await ScanService.deleteScan(params.scanId, authRes.user);

    return NextResponse.json({
      success: true,
      message: 'Property scan and associated assets successfully purged',
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
