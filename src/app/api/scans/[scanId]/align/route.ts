import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { MultiRoomAligner } from '@/lib/scanning/multiRoomAligner';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { sourceRoomId, targetRoomId, sourceAnchorPoint, targetAnchorPoint, rotationOffsetYawDeg } =
      body;

    if (!sourceRoomId || !targetRoomId || !sourceAnchorPoint || !targetAnchorPoint) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Must provide sourceRoomId, targetRoomId, sourceAnchorPoint, and targetAnchorPoint',
        },
        { status: 400 }
      );
    }

    const alignmentResult = await MultiRoomAligner.alignRooms(
      {
        scanId: params.scanId,
        sourceRoomId,
        targetRoomId,
        sourceAnchorPoint,
        targetAnchorPoint,
        rotationOffsetYawDeg: parseFloat(rotationOffsetYawDeg) || 0,
      },
      authRes.user
    );

    return NextResponse.json({
      success: true,
      data: alignmentResult,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
