import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';
import { JobQueueService } from '@/lib/scanning/jobQueueService';

export async function POST(
  req: NextRequest,
  { params }: { params: { scanId: string; jobId: string } }
) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const cancelledJob = await JobQueueService.cancelJob(params.jobId, authRes.user);

    return NextResponse.json({
      success: true,
      message: `Job ${params.jobId} cancelled`,
      data: cancelledJob,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
