import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';
import { ScanArtifact } from '@/models/ScanArtifact';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);

    const artifacts = await ScanArtifact.find({ scanId: scan._id }).sort({ version: -1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: artifacts,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
