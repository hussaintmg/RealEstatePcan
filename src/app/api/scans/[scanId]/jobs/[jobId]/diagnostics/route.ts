import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { ProcessingJob } from '@/models/ProcessingJob';
import { ScanAuditEvent } from '@/models/ScanAuditEvent';
import { ScanService } from '@/lib/scanning/scanService';

export async function GET(
  req: NextRequest,
  { params }: { params: { scanId: string; jobId: string } }
) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const scan = await ScanService.getScan(params.scanId, authRes.user);

    const job = await ProcessingJob.findOne({ _id: params.jobId, scanId: scan._id });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Processing job not found' }, { status: 404 });
    }

    const auditTrail = await ScanAuditEvent.find({ scanId: scan._id }).sort({ createdAt: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      data: {
        jobId: job._id,
        scanId: scan._id,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        stageDetails: job.stageDetails,
        errorDetails: job.errorDetails || null,
        retryCount: job.retryCount,
        maxRetries: job.maxRetries,
        workerId: job.workerId || null,
        heartbeatAt: job.heartbeatAt || null,
        startedAt: job.startedAt || null,
        finishedAt: job.finishedAt || null,
        auditTrail,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
