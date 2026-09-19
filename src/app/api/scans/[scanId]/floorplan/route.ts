import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';
import { ScanRoom } from '@/models/ScanRoom';
import { FloorPlanEngine } from '@/lib/scanning/floorPlanEngine';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_floor_plans');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);
    const rooms = await ScanRoom.find({ scanId: scan._id }).sort({ assignedOrder: 1 });

    const vectorData = FloorPlanEngine.generateFloorPlanJson(rooms);
    const svgMarkup = FloorPlanEngine.renderSvg(vectorData);

    return NextResponse.json({
      success: true,
      data: {
        vectorData,
        svgMarkup,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('scan_floor_plans');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const vectorData = body.vectorData;

    if (!vectorData || !Array.isArray(vectorData.rooms)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vectorData payload: rooms array required' },
        { status: 400 }
      );
    }

    const result = await FloorPlanEngine.saveFloorPlan(params.scanId, vectorData, authRes.user);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
