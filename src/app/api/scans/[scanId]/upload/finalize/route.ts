import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ResumableUploadService } from '@/lib/scanning/resumableUploadService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    let body: any = null;
    try {
      body = await req.json();
    } catch {}

    if (body?.directUpload && body?.storageKey) {
      const result = await ResumableUploadService.finalizeDirectUpload(
        params.scanId,
        body.storageKey,
        body.totalBytes || 0,
        body.totalFrames || 0,
        body.checksumSha256 || '',
        authRes.user
      );

      return NextResponse.json({
        success: true,
        data: {
          isFinalized: true,
          jobId: result.jobId,
          totalBytesUploaded: result.totalBytes,
          totalFrames: result.totalFrames,
          directUpload: true,
        },
      });
    }

    const result = await ResumableUploadService.finalizeUpload(params.scanId, authRes.user);

    return NextResponse.json({
      success: true,
      data: {
        isFinalized: true,
        jobId: result.jobId,
        totalBytesUploaded: result.session.totalBytesUploaded,
        totalChunks: result.session.totalChunks,
        directUpload: false,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
