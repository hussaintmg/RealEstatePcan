import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can, applyDataScope } from '@/lib/rbac';
import { Customer } from '@/models/Customer';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const { user, role } = authRes;
  if (!can(user, role, 'customer.list')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: customer.list required', 403);
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

  const finalFilter = await applyDataScope(baseFilter, user, role, 'customer.list');

  const result = await paginateQuery(Customer, {
    page,
    limit: 20,
    filter: finalFilter,
    populate: ['linkedProperties', 'invoices'],
  });

  recordAuditEvent({
    actorUserId: user.userId,
    actorEmail: user.email,
    actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
    action: 'customer.list',
    resourceType: 'customer',
    route: '/api/customers',
    method: 'GET',
    status: 200,
    durationMs: Date.now() - startTime,
  });

  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const { user, role } = authRes;
  if (!can(user, role, 'customer.create')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: customer.create required', 403);
  }

  await connectToDatabase();
  const body = await req.json();

  if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
    return standardError('VALIDATION_ERROR', 'Customer full name is required', 422, { fullName: 'Name is required' });
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return standardError('VALIDATION_ERROR', 'Valid email address is required', 422, { email: 'Invalid email' });
  }

  try {
    const customer = await Customer.create({
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      status: body.status || 'lead',
      notes: body.notes || '',
      linkedProperties: body.linkedProperties || [],
      createdBy: user.userId,
    });

    const safeCustomer = {
      id: customer._id.toString(),
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
    };

    recordAuditEvent({
      actorUserId: user.userId,
      actorEmail: user.email,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'customer.created',
      resourceType: 'customer',
      resourceId: customer._id.toString(),
      route: '/api/customers',
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, safeCustomer),
      metadata: { customerName: customer.fullName },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (err: any) {
    return standardError('CUSTOMER_CREATE_FAILED', err.message || 'Failed to create customer', 500);
  }
}
