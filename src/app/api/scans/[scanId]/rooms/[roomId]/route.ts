import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { SemanticEngine } from '@/lib/scanning/semanticEngine';
import { ScanRoom } from '@/models/ScanRoom';
import { ScanService } from '@/lib/scanning/scanService';

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string; roomId: string } }
) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);
    const room = await ScanRoom.findOne({ _id: params.roomId, scanId: scan._id });

    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { scanId: string; roomId: string } }
) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const updatedRoom = await SemanticEngine.saveRoomCorrection(
      params.scanId,
      params.roomId,
      body,
      authRes.user
    );

    return NextResponse.json({ success: true, data: updatedRoom });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
