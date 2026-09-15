import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditChangeDiff {
  before?: Record<string, any>;
  after?: Record<string, any>;
}

export interface IAuditLog extends Document {
  id: string;
  timestamp: Date;
  actorUserId?: mongoose.Types.ObjectId;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId: string;
  method?: string;
  route?: string;
  status: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  changes?: IAuditChangeDiff;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String, default: '' },
    actorRole: { type: String, default: 'anonymous', index: true },
    action: { type: String, default: 'api_request', index: true },
    resourceType: { type: String, default: 'system', index: true },
    resourceId: { type: String, default: '', index: true },
    requestId: { type: String, default: () => `req_${Date.now()}`, index: true },
    method: { type: String, default: 'POST' },
    route: { type: String, default: '' },
    status: { type: Number, default: 200, index: true },
    durationMs: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    changes: {
      before: { type: Schema.Types.Mixed },
      after: { type: Schema.Types.Mixed },
    },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

// Compound indexes for optimized filtering and pagination
AuditLogSchema.index({ timestamp: -1, action: 1 });
AuditLogSchema.index({ timestamp: -1, resourceType: 1 });
AuditLogSchema.index({ timestamp: -1, actorUserId: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
