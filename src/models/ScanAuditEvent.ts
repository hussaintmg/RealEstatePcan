import mongoose, { Schema, Document, Model } from 'mongoose';
import { ScanAuditAction } from '@/lib/scanning/types';

export interface IScanAuditEvent extends Document {
  scanId: mongoose.Types.ObjectId;
  action: ScanAuditAction;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const ScanAuditEventSchema = new Schema<IScanAuditEvent>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    action: {
      type: String,
      enum: [
        'scan_created',
        'capture_started',
        'capture_completed',
        'chunk_uploaded',
        'upload_finalized',
        'processing_dispatched',
        'stage_completed',
        'processing_completed',
        'processing_failed',
        'artifact_generated',
        'room_segmented',
        'floorplan_generated',
        'floorplan_updated',
        'calibrated',
        'measurement_added',
        'multiroom_aligned',
        'scan_deleted',
        'viewer_published',
        'viewer_revoked',
      ],
      required: true,
      index: true,
    },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ScanAuditEvent: Model<IScanAuditEvent> =
  mongoose.models.ScanAuditEvent ||
  mongoose.model<IScanAuditEvent>('ScanAuditEvent', ScanAuditEventSchema);
