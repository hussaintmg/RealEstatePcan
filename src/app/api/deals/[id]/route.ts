import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { Deal } from '@/models/Deal';
import { DealService } from '@/lib/services/dealService';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    const deal = await Deal.findById(params.id)
      .populate('propertyId')
      .populate('customerId')
      .populate('assignedAgentId', 'fullName email phone')
      .populate('invoices');

    if (!deal) {
      return standardError('NOT_FOUND', 'Deal not found.', 404);
    }

    if (!can(user, role, 'deal.view', deal)) {
      return standardError('FORBIDDEN', 'Access denied to this deal record.', 403);
    }

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in GET /api/deals/[id]:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch deal.', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    const deal = await Deal.findById(params.id);
    if (!deal) {
      return standardError('NOT_FOUND', 'Deal not found.', 404);
    }

    if (!can(user, role, 'deal.edit', deal)) {
      return standardError('FORBIDDEN', 'Insufficient permissions to modify this deal.', 403);
    }

    const body = await request.json();
    const beforeState = deal.toObject();

    // If stage update requested, use DealService to sync property status
    if (body.stage && body.stage !== deal.stage) {
      await DealService.updateDealStage(deal._id.toString(), body.stage, user.userId);
    }

    // Apply other editable fields
    if (body.title) deal.title = body.title.trim();
    if (body.notes !== undefined) deal.notes = body.notes;
    if (body.discount !== undefined) deal.discount = body.discount;
    if (body.bookingAmount !== undefined) deal.bookingAmount = body.bookingAmount;
    if (body.expectedCloseDate) deal.expectedCloseDate = new Date(body.expectedCloseDate);
    if (body.assignedAgentId) deal.assignedAgentId = body.assignedAgentId;

    await deal.save();

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'deal.updated',
      resourceType: 'deal',
      resourceId: deal._id.toString(),
      route: `/api/deals/${params.id}`,
      status: 200,
      changes: computeSafeDiff(beforeState, deal.toObject()),
      metadata: { title: deal.title, stage: deal.stage },
    });

    const updated = await Deal.findById(params.id)
      .populate('propertyId')
      .populate('customerId')
      .populate('assignedAgentId', 'fullName email');

    return NextResponse.json({ success: true, deal: updated });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in PUT /api/deals/[id]:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to update deal.', 400);
  }
}
