import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { Deal } from '@/models/Deal';
import { validateAndCalculateMilestones } from '@/lib/money';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function POST(
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
      return standardError('FORBIDDEN', 'Insufficient permissions to modify deal milestones.', 403);
    }

    const body = await request.json();
    if (!body.milestones || !Array.isArray(body.milestones) || body.milestones.length === 0) {
      return standardError('VALIDATION_ERROR', 'A valid milestones array is required.', 422);
    }

    const calc = validateAndCalculateMilestones(deal.dealValue, body.milestones, true);
    if (!calc.valid) {
      return standardError('FINANCIAL_VALIDATION_ERROR', calc.error || 'Invalid milestone distribution.', 422);
    }

    const beforeMilestones = deal.milestones ? [...deal.milestones] : [];
    deal.milestones = calc.milestones as any;
    deal.paymentPlanType = 'milestone_plan';
    await deal.save();

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'deal.milestones_updated',
      resourceType: 'deal',
      resourceId: deal._id.toString(),
      route: `/api/deals/${params.id}/milestones`,
      status: 200,
      changes: computeSafeDiff({ milestones: beforeMilestones }, { milestones: calc.milestones }),
      metadata: { dealId: params.id, milestoneCount: calc.milestones.length },
    });

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/deals/[id]/milestones:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to update milestones.', 400);
  }
}
