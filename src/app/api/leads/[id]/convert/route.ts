import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, hasPermission } from '@/lib/rbac';
import { convertLeadToCustomer } from '@/lib/services/leadService';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now();
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(session.roleId);
  if (!hasPermission(session, role, 'leads', 'update')) {
    return NextResponse.json({ error: 'Permission denied: Cannot convert leads' }, { status: 403 });
  }

  try {
    const result = await convertLeadToCustomer(params.id, session.userId);

    recordAuditEvent({
      method: 'POST',
      path: `/api/leads/${params.id}/convert`,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: session.userId,
      userEmail: session.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Lead successfully converted to Customer. Credentials generated.',
      data: result,
    });
  } catch (err: any) {
    recordAuditEvent({
      method: 'POST',
      path: `/api/leads/${params.id}/convert`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      userId: session.userId,
      userEmail: session.email,
      error: err.message,
    });

    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
