import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scans = await ScanService.listScansForProperty(params.id, authRes.user);

    return NextResponse.json({
      success: true,
      data: scans,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json().catch(() => ({}));
    const title = body.title || 'Indoor Spatial Scan';
    const deviceInfo = body.deviceInfo || {};

    const scan = await ScanService.createScan(params.id, title, authRes.user, deviceInfo);

    return NextResponse.json(
      {
        success: true,
        data: scan,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
