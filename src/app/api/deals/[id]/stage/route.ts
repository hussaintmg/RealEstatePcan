import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { Deal } from '@/models/Deal';
import { DealService } from '@/lib/services/dealService';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

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
      return standardError('FORBIDDEN', 'Insufficient permissions to modify deal stage.', 403);
    }

    const body = await request.json();
    if (!body.stage) {
      return standardError('VALIDATION_ERROR', 'Target stage is required.', 422);
    }

    const beforeStage = deal.stage;
    const updatedDeal = await DealService.updateDealStage(params.id, body.stage, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'deal.stage_changed',
      resourceType: 'deal',
      resourceId: deal._id.toString(),
      route: `/api/deals/${params.id}/stage`,
      status: 200,
      changes: computeSafeDiff({ stage: beforeStage }, { stage: body.stage }),
      metadata: { from: beforeStage, to: body.stage, title: deal.title },
    });

    return NextResponse.json({ success: true, deal: updatedDeal });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in PUT /api/deals/[id]/stage:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to advance deal stage.', 400);
  }
}
