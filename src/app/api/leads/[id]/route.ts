import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { Lead } from '@/models/Lead';
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
    return standardError('INVALID_ID', 'Invalid lead ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const lead = await Lead.findById(id).populate('propertyInterest').lean();
  if (!lead) {
    return standardError('NOT_FOUND', 'Lead record not found', 404);
  }

  // Authoritative resource-level permission and scope check
  const allowed = can(authRes.user, authRes.role, 'lead.view', lead);
  if (!allowed) {
    return standardError(
      'RBAC_FORBIDDEN',
      'Permission denied: Lead record falls outside your permitted data scope',
      403
    );
  }

  return NextResponse.json({ success: true, lead });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid lead ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const lead = await Lead.findById(id);
  if (!lead) {
    return standardError('NOT_FOUND', 'Lead record not found', 404);
  }

  const allowed = can(authRes.user, authRes.role, 'lead.edit', lead);
  if (!allowed) {
    return standardError(
      'RBAC_FORBIDDEN',
      'Permission denied: You cannot edit leads outside your permitted scope',
      403
    );
  }

  const body = await req.json();
  const beforeSnapshot = {
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    budget: lead.budget,
    status: lead.status,
    notes: lead.notes,
    assignedAgent: lead.assignedAgent?.toString(),
  };

  if (body.fullName) lead.fullName = body.fullName.trim();
  if (body.email) lead.email = body.email.trim().toLowerCase();
  if (body.phone) lead.phone = body.phone.trim();
  if (body.budget !== undefined) lead.budget = Number(body.budget);
  if (body.status) lead.status = body.status;
  if (body.notes !== undefined) lead.notes = body.notes;

  // Lead assignment requires lead.assign capability
  if (body.assignedAgent !== undefined) {
    const canAssign = can(authRes.user, authRes.role, 'lead.assign', lead);
    if (!canAssign) {
      return standardError('RBAC_FORBIDDEN', 'Permission denied: lead.assign required to assign agent', 403);
    }
    lead.assignedAgent = body.assignedAgent && mongoose.Types.ObjectId.isValid(body.assignedAgent)
      ? new mongoose.Types.ObjectId(body.assignedAgent)
      : undefined;
  }

  await lead.save();

  const afterSnapshot = {
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    budget: lead.budget,
    status: lead.status,
    notes: lead.notes,
    assignedAgent: lead.assignedAgent?.toString(),
  };

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'lead.updated',
    resourceType: 'lead',
    resourceId: lead._id.toString(),
    route: `/api/leads/${id}`,
    method: 'PUT',
    status: 200,
    durationMs: Date.now() - startTime,
    changes: computeSafeDiff(beforeSnapshot, afterSnapshot),
    metadata: { leadName: lead.fullName, status: lead.status },
  });

  return NextResponse.json({ success: true, lead });
}
