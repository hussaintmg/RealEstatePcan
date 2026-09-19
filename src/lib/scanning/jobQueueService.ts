import { connectToDatabase } from '@/lib/db';
import { ProcessingJob, IProcessingJob } from '@/models/ProcessingJob';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanService } from './scanService';
import { ScanStateMachine } from './stateMachine';
import { ProcessingStage } from './types';
import { TokenPayload } from '@/lib/session';

export class JobQueueService {
  /**
   * Enqueues a new background processing job for a scan.
   */
  static async enqueueJob(scanId: string, user: TokenPayload): Promise<IProcessingJob> {
    await connectToDatabase();
    const scan = await ScanService.getScan(scanId, user);

    const job = await ProcessingJob.create({
      scanId: scan._id,
      status: 'queued',
      stage: 'queued',
      progress: 5,
      stageDetails: 'Job queued for private GPU/CPU reconstruction worker',
      retryCount: 0,
      maxRetries: 3,
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      startedAt: new Date(),
    });

    scan.currentStage = 'queued';
    await scan.save();

    await ScanService.logAudit(
      scan._id,
      'processing_dispatched',
      `Reconstruction job ${job._id} enqueued`,
      user,
      { jobId: job._id }
    );

    return job;
  }

  /**
   * Fetches latest job associated with a scan.
   */
  static async getJobByScanId(scanId: string, user: TokenPayload): Promise<IProcessingJob | null> {
    await connectToDatabase();
    await ScanService.getScan(scanId, user);
    return ProcessingJob.findOne({ scanId }).sort({ createdAt: -1 });
  }

  /**
   * Reaps stale leases from crashed or disconnected workers and re-enqueues or fails them.
   */
  static async reapStaleJobLeases(timeoutMs: number = 60000): Promise<{ reapedCount: number; failedCount: number }> {
    await connectToDatabase();
    const staleThreshold = new Date(Date.now() - timeoutMs);

    const staleJobs = await ProcessingJob.find({
      status: 'processing',
      heartbeatAt: { $lt: staleThreshold },
    });

    let reapedCount = 0;
    let failedCount = 0;

    for (const job of staleJobs) {
      if (job.retryCount < job.maxRetries) {
        job.status = 'queued';
        job.stage = 'queued';
        job.progress = 5;
        job.retryCount += 1;
        job.stageDetails = `Worker lease timed out (worker ${job.workerId || 'unknown'} crashed). Retry #${job.retryCount} re-queued.`;
        job.workerId = undefined;
        job.heartbeatAt = undefined;
        await job.save();

        await PropertyScan.findByIdAndUpdate(job.scanId, {
          status: 'processing',
          currentStage: 'queued',
        });
        reapedCount++;
      } else {
        job.status = 'failed';
        job.stage = 'failed';
        job.errorDetails = `Worker lease timed out after maximum retries (${job.maxRetries}). Processing halted.`;
        job.stageDetails = 'Failed: worker timeout exceeded max retries';
        job.finishedAt = new Date();
        await job.save();

        await PropertyScan.findByIdAndUpdate(job.scanId, {
          status: 'failed',
          currentStage: 'failed',
        });
        failedCount++;
      }
    }

    return { reapedCount, failedCount };
  }

  /**
   * Worker method: leases the next queued job atomically.
   */
  static async acquireNextJob(workerId: string): Promise<IProcessingJob | null> {
    await connectToDatabase();

    // First reap any crashed worker leases
    await this.reapStaleJobLeases();

    const job = await ProcessingJob.findOneAndUpdate(
      { status: 'queued' },
      {
        $set: {
          status: 'processing',
          stage: 'validating',
          progress: 10,
          stageDetails: 'Worker lease acquired. Validating frame integrity.',
          workerId,
          heartbeatAt: new Date(),
          startedAt: new Date(),
        },
      },
      { new: true, sort: { createdAt: 1 } }
    );

    if (job) {
      await PropertyScan.findByIdAndUpdate(job.scanId, { currentStage: 'validating' });
    }

    return job;
  }

  /**
   * Updates stage, progress percentage, and lease heartbeat.
   */
  static async updateJobProgress(
    jobId: string,
    stage: ProcessingStage,
    progress: number,
    stageDetails?: string
  ): Promise<IProcessingJob | null> {
    await connectToDatabase();

    const job = await ProcessingJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          stage,
          progress: Math.min(Math.max(progress, 0), 100),
          stageDetails: stageDetails || `Executing stage: ${stage}`,
          heartbeatAt: new Date(),
        },
      },
      { new: true }
    );

    if (job) {
      await PropertyScan.findByIdAndUpdate(job.scanId, { currentStage: stage });
    }

    return job;
  }

  /**
   * Records a worker heartbeat to prevent lease timeout.
   */
  static async heartbeatJob(jobId: string, workerId: string): Promise<boolean> {
    await connectToDatabase();
    const result = await ProcessingJob.updateOne(
      { _id: jobId, workerId, status: 'processing' },
      { $set: { heartbeatAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Marks a job as successfully completed.
   */
  static async completeJob(jobId: string): Promise<IProcessingJob | null> {
    await connectToDatabase();

    const job = await ProcessingJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: 'completed',
          stage: 'completed',
          progress: 100,
          stageDetails: 'Spatial reconstruction completed successfully',
          finishedAt: new Date(),
        },
      },
      { new: true }
    );

    if (job) {
      await PropertyScan.findByIdAndUpdate(job.scanId, {
        status: 'ready',
        currentStage: 'completed',
        completedAt: new Date(),
      });
    }

    return job;
  }

  /**
   * Marks a job as failed and records the failure diagnostics.
   */
  static async failJob(jobId: string, errorDetails: string): Promise<IProcessingJob | null> {
    await connectToDatabase();

    const job = await ProcessingJob.findByIdAndUpdate(
      jobId,
      {
        $set: {
          status: 'failed',
          stage: 'failed',
          errorDetails,
          stageDetails: `Failed: ${errorDetails}`,
          finishedAt: new Date(),
        },
      },
      { new: true }
    );

    if (job) {
      await PropertyScan.findByIdAndUpdate(job.scanId, {
        status: 'failed',
        currentStage: 'failed',
      });
    }

    return job;
  }

  /**
   * Cancels a running or queued job.
   */
  static async cancelJob(jobId: string, user: TokenPayload): Promise<IProcessingJob | null> {
    await connectToDatabase();

    const job = await ProcessingJob.findById(jobId);
    if (!job) {
      const err = new Error('Job not found');
      (err as any).status = 404;
      throw err;
    }

    await ScanService.getScan(job.scanId.toString(), user);

    if (job.status === 'completed') {
      const err = new Error('Cannot cancel an already completed job');
      (err as any).status = 400;
      throw err;
    }

    job.status = 'cancelled';
    job.stageDetails = 'Job cancelled by user';
    job.finishedAt = new Date();
    await job.save();

    await PropertyScan.findByIdAndUpdate(job.scanId, {
      status: 'draft',
      currentStage: 'cancelled',
    });

    await ScanService.logAudit(job.scanId, 'processing_failed', `Job ${job._id} cancelled by user`, user);

    return job;
  }

  /**
   * Retries a failed or cancelled job.
   */
  static async retryJob(jobId: string, user: TokenPayload): Promise<IProcessingJob> {
    await connectToDatabase();

    const job = await ProcessingJob.findById(jobId);
    if (!job) {
      const err = new Error('Job not found');
      (err as any).status = 404;
      throw err;
    }

    await ScanService.getScan(job.scanId.toString(), user);

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      const err = new Error(`Only failed or cancelled jobs can be retried. Current status: ${job.status}`);
      (err as any).status = 400;
      throw err;
    }

    job.status = 'queued';
    job.stage = 'queued';
    job.progress = 5;
    job.stageDetails = 'Retried: job re-queued for processing worker';
    job.retryCount += 1;
    job.errorDetails = undefined;
    job.startedAt = new Date();
    job.finishedAt = undefined;
    await job.save();

    await PropertyScan.findByIdAndUpdate(job.scanId, {
      status: 'processing',
      currentStage: 'queued',
    });

    await ScanService.logAudit(
      job.scanId,
      'processing_dispatched',
      `Job ${job._id} retry #${job.retryCount} enqueued`,
      user
    );

    return job;
  }
}
