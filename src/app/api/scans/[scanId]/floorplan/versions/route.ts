import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanArtifact } from '@/models/ScanArtifact';
import { ScanService } from '@/lib/scanning/scanService';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_floor_plans');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);

    const versions = await ScanArtifact.find({
      scanId: scan._id,
      type: { $in: ['floorplan_svg', 'floorplan_json'] },
    }).sort({ version: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
