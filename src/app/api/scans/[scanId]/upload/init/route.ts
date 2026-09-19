import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ResumableUploadService } from '@/lib/scanning/resumableUploadService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { totalChunks, chunkSize, totalBytesExpected, manifestData } = body;

    if (!totalChunks || !chunkSize || !totalBytesExpected) {
      return NextResponse.json(
        { success: false, error: 'Missing required upload parameters: totalChunks, chunkSize, totalBytesExpected' },
        { status: 400 }
      );
    }

    const { session, uploadedChunkIndices } = await ResumableUploadService.initSession(
      params.scanId,
      { totalChunks, chunkSize, totalBytesExpected, manifestData },
      authRes.user
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session._id,
        totalChunks: session.totalChunks,
        chunkSize: session.chunkSize,
        totalBytesExpected: session.totalBytesExpected,
        uploadedChunkIndices,
        isResumed: uploadedChunkIndices.length > 0,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
