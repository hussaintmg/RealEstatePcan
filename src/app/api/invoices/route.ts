import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can, applyDataScope } from '@/lib/rbac';
import { Invoice } from '@/models/Invoice';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const { user, role } = authRes;
  if (!can(user, role, 'invoice.list')) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: invoice.list required', 403);
  }

  await connectToDatabase();
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const baseFilter: any = {};
  if (search) {
    baseFilter.$or = [{ invoiceNumber: new RegExp(search, 'i') }];
  }
  if (status) baseFilter.status = status;

  const finalFilter = await applyDataScope(baseFilter, user, role, 'invoice.list');

  const result = await paginateQuery(Invoice, {
    page,
    limit: 20,
    filter: finalFilter,
    populate: ['customerId', 'propertyId'],
  });

  recordAuditEvent({
    actorUserId: user.userId,
    actorEmail: user.email,
    actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
    action: 'invoice.list',
    resourceType: 'invoice',
    route: '/api/invoices',
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
  const allowed =
    user.isDeveloper ||
    user.isOwner ||
    can(user, role, 'invoice.record_payment') ||
    can(user, role, 'deal.close');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: Cannot create or issue invoices', 403);
  }

  await connectToDatabase();
  const body = await req.json();

  if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    return standardError('VALIDATION_ERROR', 'A valid positive invoice amount is required', 422, {
      amount: 'Invalid amount',
    });
  }

  try {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const invoice = await Invoice.create({
      ...body,
      invoiceNumber,
      amount: Number(body.amount),
      status: body.status || 'pending',
      createdBy: user.userId,
    });

    const safeInvoice = {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      status: invoice.status,
      customerId: invoice.customerId?.toString(),
    };

    recordAuditEvent({
      actorUserId: user.userId,
      actorEmail: user.email,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'invoice.created',
      resourceType: 'invoice',
      resourceId: invoice._id.toString(),
      route: '/api/invoices',
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, safeInvoice),
      metadata: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (err: any) {
    return standardError('INVOICE_CREATE_FAILED', err.message || 'Failed to create invoice', 500);
  }
}
