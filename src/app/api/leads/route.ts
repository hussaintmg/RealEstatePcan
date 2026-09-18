import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { getSessionUser } from '@/lib/auth';
import { can, applyDataScope, getUserRole } from '@/lib/rbac';
import { Lead } from '@/models/Lead';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const { user, role } = authRes;
  if (!can(user, role, 'lead.list')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: lead.list required', 403);
  }

  await connectToDatabase();
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const baseFilter: any = {};
  if (search) {
    baseFilter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }
  if (status) baseFilter.status = status;

  const finalFilter = await applyDataScope(baseFilter, user, role, 'lead.list');

  const result = await paginateQuery(Lead, {
    page,
    limit: 20,
    filter: finalFilter,
    populate: 'propertyInterest',
  });

  recordAuditEvent({
    actorUserId: user.userId,
    actorEmail: user.email,
    actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
    action: 'lead.list',
    resourceType: 'lead',
    route: '/api/leads',
    method: 'GET',
    status: 200,
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();
  const body = await req.json();

  const user = await getSessionUser();
  let role = null;
  if (user) {
    role = await getUserRole(user.roleId);
    if (!can(user, role, 'lead.create')) {
      return standardError('RBAC_FORBIDDEN', 'Permission denied: lead.create required', 403);
    }
  }

  if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
    return standardError('VALIDATION_ERROR', 'Prospect name is required', 422, { fullName: 'Name is required' });
  }

  try {
    const lead = await Lead.create({
      fullName: body.fullName.trim(),
      email: body.email ? body.email.trim().toLowerCase() : '',
      phone: body.phone ? body.phone.trim() : '',
      status: body.status || 'new',
      budget: body.budget,
      propertyInterest: body.propertyInterest,
      notes: body.notes || '',
      assignedAgent: body.assignedAgent,
      createdBy: user?.userId || '000000000000000000000000', // Guest intake if public
    });

    const safeLead = {
      id: lead._id.toString(),
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
    };

    if (user) {
      recordAuditEvent({
        actorUserId: user.userId,
        actorEmail: user.email,
        actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
        action: 'lead.created',
        resourceType: 'lead',
        resourceId: lead._id.toString(),
        route: '/api/leads',
        method: 'POST',
        status: 201,
        durationMs: Date.now() - startTime,
        changes: computeSafeDiff(undefined, safeLead),
        metadata: { leadName: lead.fullName },
      });
    }

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err: any) {
    return standardError('LEAD_CREATE_FAILED', err.message || 'Failed to create lead', 500);
  }
}
