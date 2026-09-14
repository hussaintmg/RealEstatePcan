import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { auditEmitter, getRecentAuditEvents, IAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || (!user.isOwner && !user.isDeveloper)) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Owner or Developer only.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial history
  const recent = getRecentAuditEvents();
  writer.write(encoder.encode(`event: history\ndata: ${JSON.stringify(recent)}\n\n`));

  // Handler for live events
  const onEvent = (event: IAuditEvent) => {
    try {
      writer.write(encoder.encode(`event: audit\ndata: ${JSON.stringify(event)}\n\n`));
    } catch {
      // client disconnected
    }
  };

  auditEmitter.on('audit_event', onEvent);

  // Keep-alive heartbeat interval
  const heartbeat = setInterval(() => {
    try {
      writer.write(encoder.encode(': heartbeat\n\n'));
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    auditEmitter.off('audit_event', onEvent);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
