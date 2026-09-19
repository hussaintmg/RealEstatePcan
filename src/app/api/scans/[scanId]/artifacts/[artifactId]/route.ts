import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/authGuard';
import { ScanService } from '@/lib/scanning/scanService';
import { ScanArtifact } from '@/models/ScanArtifact';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanStorageAdapter } from '@/lib/scanning/storageAdapter';
import { connectToDatabase } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string; artifactId: string } }
) {
  try {
    await connectToDatabase();
    const scan = await PropertyScan.findById(params.scanId);
    if (!scan) {
      return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 });
    }

    const artifact = await ScanArtifact.findOne({
      _id: params.artifactId,
      scanId: scan._id,
    });
    if (!artifact) {
      return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
    }

    // --- STRICT AUTHORIZATION GATE ---
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expires = parseInt(url.searchParams.get('expires') || '0', 10);
    const shareToken = url.searchParams.get('shareToken');

    let authorized = false;

    // 1. Signed Expiring Token Authorization
    if (token && expires) {
      const isValid = ScanStorageAdapter.verifySignedToken(
        artifact.storageKey,
        scan.tenantId || scan.createdBy.toString(),
        expires,
        token
      );
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Artifact access token is invalid or expired' },
          { status: 403 }
        );
      }
      authorized = true;
    }

    // 2. Public Share Token Authorization
    if (!authorized && shareToken) {
      if (scan.isPublic && scan.publicShareToken && scan.publicShareToken === shareToken) {
        authorized = true;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid or revoked public share token' },
          { status: 403 }
        );
      }
    }

    // 3. User Session Authorization
    if (!authorized) {
      const authRes = await requireUser();
      if (authRes.error) {
        return NextResponse.json(
          { success: false, error: 'Authentication required to access scan artifact' },
          { status: 401 }
        );
      }
      // Asserts tenant authority
      await ScanService.assertAccess(scan.createdBy, authRes.user);
      authorized = true;
    }

    // Read artifact file with path traversal guard
    const fileBuffer = await ScanStorageAdapter.readFile(artifact.storageKey);
    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: 'Artifact file missing from storage' },
        { status: 404 }
      );
    }

    const totalLength = fileBuffer.length;
    const detectedMime = ScanStorageAdapter.sniffMimeType(fileBuffer, artifact.mimeType);

    // --- HTTP RANGE REQUEST SUPPORT ---
    const rangeHeader = req.headers.get('range');
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (isNaN(start) || isNaN(end) || start > end || start >= totalLength || end >= totalLength) {
        return new NextResponse(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            'Content-Range': `bytes */${totalLength}`,
          },
        });
      }

      const chunkBuffer = fileBuffer.slice(start, end + 1);
      return new NextResponse(new Uint8Array(chunkBuffer), {
        status: 206, // Partial Content
        headers: {
          'Content-Type': detectedMime,
          'Content-Range': `bytes ${start}-${end}/${totalLength}`,
          'Content-Length': chunkBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    // Full Content Response
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': detectedMime,
        'Content-Length': totalLength.toString(),
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${artifact.type}_v${artifact.version}.${
          artifact.type.includes('glb') ? 'glb' : artifact.type.includes('ply') ? 'ply' : 'bin'
        }"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
