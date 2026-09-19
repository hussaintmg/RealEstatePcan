import EventEmitter from 'events';
import mongoose from 'mongoose';
import { AuditLog, IAuditChangeDiff } from '../models/AuditLog';
import { connectToDatabase } from './db';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'apikey',
  'anonkey',
  'servicerolekey',
  'cookie',
  'creditcard',
  'cvv',
  'authorization',
  'refreshtoken',
  'accesstoken',
]);

/**
 * Recursively sanitize objects and arrays, replacing secrets with [REDACTED]
 */
export function redactSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      result[key] = redactSecrets(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Computes a clean before/after diff between two states, redacting any sensitive attributes.
 */
export function computeSafeDiff(beforeState?: any, afterState?: any): IAuditChangeDiff | undefined {
  if (!beforeState && !afterState) return undefined;

  const safeBefore = beforeState ? redactSecrets(JSON.parse(JSON.stringify(beforeState))) : undefined;
  const safeAfter = afterState ? redactSecrets(JSON.parse(JSON.stringify(afterState))) : undefined;

  return {
    before: safeBefore,
    after: safeAfter,
  };
}

export interface IAuditEvent {
  id: string;
  timestamp: string;
  actorUserId?: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId: string;
  method: string;
  route: string;
  path?: string; // backwards compatibility
  statusCode?: number; // backwards compatibility
  status: number;
  durationMs: number;
  metadata?: Record<string, any>;
  changes?: IAuditChangeDiff;
  ip?: string;
  userAgent?: string;
  error?: string;
}

class AuditStreamEmitter extends EventEmitter {}

export const auditEmitter = new AuditStreamEmitter();

// In-memory ring buffer of last 100 audit events for instant fallback or SSE
const recentAuditEvents: IAuditEvent[] = [];
const MAX_EVENTS = 100;

export interface RecordAuditParams {
  actorUserId?: string;
  userId?: string; // backwards compatibility
  actorEmail?: string;
  userEmail?: string; // backwards compatibility
  actorRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  resource?: string; // backwards compatibility alias for resourceType
  severity?: 'low' | 'medium' | 'high' | 'critical' | string;
  details?: Record<string, any>; // backwards compatibility alias for metadata
  requestId?: string;
  method?: string;
  route?: string;
  path?: string; // backwards compatibility
  status?: number;
  statusCode?: number; // backwards compatibility
  durationMs?: number;
  metadata?: Record<string, any>;
  changes?: IAuditChangeDiff;
  ip?: string;
  userAgent?: string;
  error?: string;
}

export const logAuditEvent = recordAuditEvent;
export const recordAudit = recordAuditEvent;

const pendingWrites = new Set<Promise<any>>();

export async function flushAuditLogs(timeoutMs: number = 3000): Promise<void> {
  if (pendingWrites.size === 0) return;
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([Promise.allSettled(Array.from(pendingWrites)), timeoutPromise]);
}

export function recordAuditEvent(params: RecordAuditParams): IAuditEvent {
  const reqId = params.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = params.status ?? params.statusCode ?? 200;
  const route = params.route || params.path || '';
  const actorUserId = params.actorUserId || params.userId;
  const actorEmail = params.actorEmail || params.userEmail;

  const rawMeta = params.metadata || params.details;
  const safeMetadata = rawMeta ? redactSecrets(rawMeta) : undefined;
  const safeChanges = params.changes
    ? {
        before: params.changes.before ? redactSecrets(params.changes.before) : undefined,
        after: params.changes.after ? redactSecrets(params.changes.after) : undefined,
      }
    : undefined;

  const auditEntry: IAuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    actorUserId,
    actorEmail,
    actorRole: params.actorRole || 'anonymous',
    action: params.action || `${params.method || 'POST'}:${route || 'action'}`,
    resourceType: params.resourceType || params.resource || 'system',
    resourceId: params.resourceId,
    requestId: reqId,
    method: params.method || 'POST',
    route,
    path: route,
    status,
    statusCode: status,
    durationMs: params.durationMs || 0,
    metadata: safeMetadata,
    changes: safeChanges,
    ip: params.ip || '',
    userAgent: params.userAgent || '',
    error: params.error,
  };

  // 1. Maintain in-memory ring buffer
  recentAuditEvents.unshift(auditEntry);
  if (recentAuditEvents.length > MAX_EVENTS) {
    recentAuditEvents.pop();
  }

  // 2. Broadcast to active SSE subscribers
  auditEmitter.emit('audit_event', auditEntry);

  // 3. Persist asynchronously to MongoDB
  const writePromise = (async () => {
    try {
      await connectToDatabase();
      await AuditLog.create({
        timestamp: new Date(auditEntry.timestamp),
        actorUserId: auditEntry.actorUserId && mongoose.Types.ObjectId.isValid(auditEntry.actorUserId)
          ? new mongoose.Types.ObjectId(auditEntry.actorUserId)
          : undefined,
        actorEmail: auditEntry.actorEmail,
        actorRole: auditEntry.actorRole,
        action: auditEntry.action,
        resourceType: auditEntry.resourceType,
        resourceId: auditEntry.resourceId,
        requestId: auditEntry.requestId,
        method: auditEntry.method,
        route: auditEntry.route,
        status: auditEntry.status,
        durationMs: auditEntry.durationMs,
        metadata: auditEntry.metadata,
        changes: auditEntry.changes,
        ip: auditEntry.ip,
        userAgent: auditEntry.userAgent,
      });
    } catch (err) {
      // Non-blocking log persistence error
      console.warn('[AuditLogger] Could not persist to DB:', err);
    }
  })();

  pendingWrites.add(writePromise);
  writePromise.finally(() => pendingWrites.delete(writePromise));

  return auditEntry;
}

export function getRecentAuditEvents(): IAuditEvent[] {
  return [...recentAuditEvents];
}

export interface AuditQueryFilters {
  search?: string;
  action?: string;
  resourceType?: string;
  actorUserId?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function queryAuditLogs(filters: AuditQueryFilters = {}) {
  await connectToDatabase();

  const query: Record<string, any> = {};

  if (filters.action) {
    query.action = filters.action;
  }
  if (filters.resourceType) {
    query.resourceType = filters.resourceType;
  }
  if (filters.actorUserId && mongoose.Types.ObjectId.isValid(filters.actorUserId)) {
    query.actorUserId = new mongoose.Types.ObjectId(filters.actorUserId);
  }
  if (typeof filters.status === 'number') {
    query.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  if (filters.search) {
    const searchRegex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { action: searchRegex },
      { resourceType: searchRegex },
      { actorEmail: searchRegex },
      { requestId: searchRegex },
    ];
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log._id.toString(),
      timestamp: log.timestamp ? log.timestamp.toISOString() : new Date().toISOString(),
      actorUserId: log.actorUserId?.toString(),
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      requestId: log.requestId,
      method: log.method,
      route: log.route,
      status: log.status,
      durationMs: log.durationMs,
      metadata: log.metadata,
      changes: log.changes,
      ip: log.ip,
      userAgent: log.userAgent,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
