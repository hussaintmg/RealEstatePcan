import EventEmitter from 'events';

export interface IAuditEvent {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ip?: string;
  error?: string;
}

class AuditStreamEmitter extends EventEmitter {}

export const auditEmitter = new AuditStreamEmitter();

// Keep in-memory ring buffer of last 100 audit events for new subscribers
const recentAuditEvents: IAuditEvent[] = [];
const MAX_EVENTS = 100;

export function recordAuditEvent(event: Omit<IAuditEvent, 'id' | 'timestamp'>) {
  const auditEntry: IAuditEvent = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };

  recentAuditEvents.unshift(auditEntry);
  if (recentAuditEvents.length > MAX_EVENTS) {
    recentAuditEvents.pop();
  }

  // Broadcast to active SSE listeners
  auditEmitter.emit('audit_event', auditEntry);
  return auditEntry;
}

export function getRecentAuditEvents(): IAuditEvent[] {
  return [...recentAuditEvents];
}
