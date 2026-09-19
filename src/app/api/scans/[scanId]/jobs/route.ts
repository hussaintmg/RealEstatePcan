import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { JobQueueService } from '@/lib/scanning/jobQueueService';

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const job = await JobQueueService.getJobByScanId(params.scanId, authRes.user);

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { scanId: string } }) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const body = await req.json();
    const { action, jobId } = body;

    if (!jobId || !['cancel', 'retry'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Must provide valid jobId and action ("cancel" or "retry")' },
        { status: 400 }
      );
    }

    let updatedJob;
    if (action === 'cancel') {
      updatedJob = await JobQueueService.cancelJob(jobId, authRes.user);
    } else {
      updatedJob = await JobQueueService.retryJob(jobId, authRes.user);
    }

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
