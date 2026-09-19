import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ResumableUploadService } from '@/lib/scanning/resumableUploadService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const contentType = req.headers.get('content-type') || '';
    let chunkIndex: number;
    let clientSha256: string;
    let buffer: Buffer;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const chunkField = formData.get('chunkIndex');
      const sha256Field = formData.get('checksumSha256');
      const fileField = formData.get('file');

      if (!chunkField || !fileField || !(fileField instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: 'Missing chunkIndex or file in multipart form data' },
          { status: 400 }
        );
      }

      chunkIndex = parseInt(chunkField.toString(), 10);
      clientSha256 = (sha256Field ? sha256Field.toString() : '') || '';
      const arrayBuf = await fileField.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    } else {
      const chunkHeader = req.headers.get('x-chunk-index');
      clientSha256 = req.headers.get('x-chunk-sha256') || '';

      if (chunkHeader === null) {
        return NextResponse.json(
          { success: false, error: 'Missing x-chunk-index header' },
          { status: 400 }
        );
      }

      chunkIndex = parseInt(chunkHeader, 10);
      const arrayBuf = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
    }

    if (isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid chunk index' },
        { status: 400 }
      );
    }

    const result = await ResumableUploadService.uploadChunk(
      params.scanId,
      chunkIndex,
      buffer,
      clientSha256,
      authRes.user
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
