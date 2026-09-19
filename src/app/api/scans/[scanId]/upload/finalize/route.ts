import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ResumableUploadService } from '@/lib/scanning/resumableUploadService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const result = await ResumableUploadService.finalizeUpload(params.scanId, authRes.user);

    return NextResponse.json({
      success: true,
      data: {
        isFinalized: true,
        jobId: result.jobId,
        totalBytesUploaded: result.session.totalBytesUploaded,
        totalChunks: result.session.totalChunks,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
