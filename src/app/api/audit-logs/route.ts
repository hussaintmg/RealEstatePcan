import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { queryAuditLogs, recordAuditEvent } from '@/lib/auditLogger';
import { can, getUserRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const role = await getUserRole(authRes.user.roleId);
  const allowed = authRes.user.isDeveloper || authRes.user.isOwner || can(authRes.user, role, 'audit.view');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: audit.view required', 403);
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || undefined;
  const action = searchParams.get('action') || undefined;
  const resourceType = searchParams.get('resourceType') || undefined;
  const status = searchParams.get('status') ? parseInt(searchParams.get('status')!, 10) : undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  try {
    const result = await queryAuditLogs({
      page,
      limit,
      search,
      action,
      resourceType,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return standardError('AUDIT_QUERY_FAILED', err.message || 'Failed to query audit logs', 500);
  }
}
