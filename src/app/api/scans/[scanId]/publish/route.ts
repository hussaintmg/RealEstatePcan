import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);

    // Generate revocable cryptographically random public share token
    const token = crypto.randomBytes(24).toString('hex');
    scan.isPublic = true;
    scan.publicShareToken = token;
    await scan.save();

    await ScanService.logAudit(
      scan._id,
      'viewer_published',
      `Scan published with revocable public share token (${token.slice(0, 8)}...)`,
      authRes.user
    );

    return NextResponse.json({
      success: true,
      data: {
        isPublic: true,
        publicShareToken: token,
        publicViewerUrl: `/viewer/${scan._id}?token=${token}`,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
