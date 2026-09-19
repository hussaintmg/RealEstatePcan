import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProcessingJobStatus, ProcessingStage } from '@/lib/scanning/types';

export interface IProcessingJob extends Document {
  scanId: mongoose.Types.ObjectId;
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  progress: number;
  stageDetails?: string;
  errorDetails?: string;
  retryCount: number;
  maxRetries: number;
  workerId?: string;
  heartbeatAt?: Date;
  startedAt?: Date;
  finishedAt?: Date;
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessingJobSchema = new Schema<IProcessingJob>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    stage: {
      type: String,
      enum: [
        'queued',
        'validating',
        'camera_tracking',
        'sparse_pointcloud',
        'dense_reconstruction',
        'mesh_generation',
        'texturing',
        'gaussian_splatting',
        'floor_plan_synthesis',
        'completed',
        'failed',
      ],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    stageDetails: { type: String, default: 'Job enqueued for spatial reconstruction worker' },
    errorDetails: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    workerId: { type: String },
    heartbeatAt: { type: Date },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ProcessingJob: Model<IProcessingJob> =
  mongoose.models.ProcessingJob ||
  mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
