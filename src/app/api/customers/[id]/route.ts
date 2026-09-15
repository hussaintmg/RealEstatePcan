import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { Customer } from '@/models/Customer';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { can } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid customer ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const customer = await Customer.findById(id).lean();
  if (!customer) {
    return standardError('NOT_FOUND', 'Customer record not found', 404);
  }

  // Authoritative resource-level permission and scope check
  const allowed = can(authRes.user, authRes.role, 'customer.view', customer);
  if (!allowed) {
    return standardError(
      'RBAC_FORBIDDEN',
      'Permission denied: Customer record falls outside your permitted data scope',
      403
    );
  }

  return NextResponse.json({ success: true, customer });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid customer ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const customer = await Customer.findById(id);
  if (!customer) {
    return standardError('NOT_FOUND', 'Customer record not found', 404);
  }

  const allowed = can(authRes.user, authRes.role, 'customer.edit', customer);
  if (!allowed) {
    return standardError(
      'RBAC_FORBIDDEN',
      'Permission denied: You cannot edit customer records outside your permitted scope',
      403
    );
  }

  const body = await req.json();
  const beforeSnapshot = {
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    notes: customer.notes,
  };

  if (body.fullName) customer.fullName = body.fullName.trim();
  if (body.email) customer.email = body.email.trim().toLowerCase();
  if (body.phone) customer.phone = body.phone.trim();
  if (body.status) customer.status = body.status;
  if (body.notes !== undefined) customer.notes = body.notes;

  await customer.save();

  const afterSnapshot = {
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    notes: customer.notes,
  };

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'customer.updated',
    resourceType: 'customer',
    resourceId: customer._id.toString(),
    route: `/api/customers/${id}`,
    method: 'PUT',
    status: 200,
    durationMs: Date.now() - startTime,
    changes: computeSafeDiff(beforeSnapshot, afterSnapshot),
    metadata: { customerName: customer.fullName },
  });

  return NextResponse.json({ success: true, customer });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid customer ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const customer = await Customer.findById(id);
  if (!customer) {
    return standardError('NOT_FOUND', 'Customer record not found', 404);
  }

  const allowed = can(authRes.user, authRes.role, 'customer.archive', customer);
  if (!allowed) {
    return standardError(
      'RBAC_FORBIDDEN',
      'Permission denied: customer.archive required to archive this customer',
      403
    );
  }

  customer.status = 'archived';
  await customer.save();

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'customer.archived',
    resourceType: 'customer',
    resourceId: customer._id.toString(),
    route: `/api/customers/${id}`,
    method: 'DELETE',
    status: 200,
    durationMs: Date.now() - startTime,
    metadata: { customerName: customer.fullName },
  });

  return NextResponse.json({ success: true, message: 'Customer archived successfully' });
}
