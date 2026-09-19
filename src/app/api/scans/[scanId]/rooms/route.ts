import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';
import { ScanRoom } from '@/models/ScanRoom';
import { SemanticEngine } from '@/lib/scanning/semanticEngine';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);
    const rooms = await ScanRoom.find({ scanId: scan._id }).sort({ assignedOrder: 1 });

    return NextResponse.json({
      success: true,
      data: rooms,
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

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { name, roomType, bounds, assignedOrder } = body;

    const defaultBounds = bounds || {
      minX: -2.5,
      maxX: 2.5,
      minY: 0,
      maxY: 2.8,
      minZ: -2.0,
      maxZ: 2.0,
    };

    const result = await SemanticEngine.segmentRoom(
      params.scanId,
      {
        name: name || 'Primary Room',
        roomType: roomType || 'living_room',
        bounds: defaultBounds,
        assignedOrder,
      },
      authRes.user
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
