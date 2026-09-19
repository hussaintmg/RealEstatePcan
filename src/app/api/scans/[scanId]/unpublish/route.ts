import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);

    scan.isPublic = false;
    scan.publicShareToken = undefined;
    await scan.save();

    await ScanService.logAudit(
      scan._id,
      'viewer_revoked',
      `Scan unpublished and public share tokens revoked`,
      authRes.user
    );

    return NextResponse.json({
      success: true,
      message: 'Scan unpublished and public share token revoked',
      data: {
        isPublic: false,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
