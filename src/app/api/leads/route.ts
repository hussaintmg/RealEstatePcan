import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getUserRole, hasPermission, applyDataScope } from '@/lib/rbac';
import { Lead } from '@/models/Lead';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserRole(user.roleId);
  if (!hasPermission(user, role, 'leads', 'read')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

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

  const finalFilter = await applyDataScope(baseFilter, user, role);

  const result = await paginateQuery(Lead, {
    page,
    limit: 20,
    filter: finalFilter,
    populate: 'propertyInterest',
  });

  recordAuditEvent({
    method: 'GET',
    path: '/api/leads',
    statusCode: 200,
    durationMs: Date.now() - startTime,
    userId: user.userId,
    userEmail: user.email,
  });

  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();
  const body = await req.json();

  const user = await getSessionUser();

  try {
    const lead = await Lead.create({
      ...body,
      createdBy: user?.userId || '000000000000000000000000', // Guest intake if public
    });

    if (user) {
      recordAuditEvent({
        method: 'POST',
        path: '/api/leads',
        statusCode: 201,
        durationMs: Date.now() - startTime,
        userId: user.userId,
        userEmail: user.email,
      });
    }

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
