import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { ProcessingJob } from '@/models/ProcessingJob';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanArtifact } from '@/models/ScanArtifact';
import { JobQueueService } from '@/lib/scanning/jobQueueService';
import { ScanService } from '@/lib/scanning/scanService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-worker-signature');
    const secret = process.env.GPU_RECONSTRUCTION_WORKER_SECRET || 'dev_secret_key';

    // Verify HMAC signature
    const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (signature !== expectedSig) {
      return NextResponse.json({ success: false, error: 'Invalid worker webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { jobId, stage, progress, status, errorDetails, stageDetails, artifacts } = payload;

    await connectToDatabase();
    const job = await ProcessingJob.findById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const scan = await PropertyScan.findById(params.scanId);
    if (!scan) {
      return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 });
    }

    // Update progress
    if (stage && typeof progress === 'number') {
      await JobQueueService.updateJobProgress(jobId, stage, progress, stageDetails);
    }

    // If failed
    if (status === 'failed') {
      await JobQueueService.failJob(jobId, errorDetails || 'Worker reported failure');
      return NextResponse.json({ success: true, message: 'Job marked as failed' });
    }

    // If completed and artifacts delivered
    if (status === 'completed') {
      if (Array.isArray(artifacts)) {
        const latestArt = await ScanArtifact.findOne({ scanId: scan._id }).sort({ version: -1 });
        const version = latestArt ? latestArt.version + 1 : 1;

        for (const art of artifacts) {
          await ScanArtifact.create({
            scanId: scan._id,
            type: art.type,
            version,
            storageKey: art.storageKey,
            fileSizeBytes: art.sizeBytes || 0,
            checksumSha256: art.sha256 || '',
            mimeType: art.mimeType || 'application/octet-stream',
            tenantId: scan.tenantId,
            createdBy: scan.createdBy,
            metadata: {
              reconstructionMethod: 'genuine_gpu_photogrammetry',
              workerId: job.workerId,
              ...art.metadata,
            },
          });
        }
      }

      await JobQueueService.completeJob(jobId);
      return NextResponse.json({ success: true, message: 'Job marked completed and artifacts recorded' });
    }

    return NextResponse.json({ success: true, message: 'Progress updated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
