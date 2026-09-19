import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { JobQueueService } from '@/lib/scanning/jobQueueService';

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json().catch(() => ({}));
    let jobId = body.jobId;

    if (!jobId) {
      const latestJob = await JobQueueService.getJobByScanId(params.scanId, authRes.user);
      if (!latestJob) {
        return NextResponse.json({ success: false, error: 'No job found to retry' }, { status: 404 });
      }
      jobId = latestJob._id.toString();
    }

    const retriedJob = await JobQueueService.retryJob(jobId, authRes.user);

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} re-enqueued for processing`,
      data: retriedJob,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
