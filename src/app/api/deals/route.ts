import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can, applyDataScope } from '@/lib/rbac';
import { Deal } from '@/models/Deal';
import { DealService } from '@/lib/services/dealService';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'deal.list')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to list deals.', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const search = searchParams.get('search') || '';
    const stage = searchParams.get('stage') || '';
    const propertyId = searchParams.get('propertyId') || '';
    const customerId = searchParams.get('customerId') || '';

    let baseFilter: Record<string, any> = {};

    if (search.trim()) {
      baseFilter.title = { $regex: search.trim(), $options: 'i' };
    }

    if (stage) {
      baseFilter.stage = stage;
    }

    if (propertyId) {
      baseFilter.propertyId = propertyId;
    }

    if (customerId) {
      baseFilter.customerId = customerId;
    }

    const scopedFilter = await applyDataScope(baseFilter, user, role, 'deal.list');

    const result = await paginateQuery(Deal, {
      page,
      limit,
      filter: scopedFilter,
      populate: [
        { path: 'propertyId', select: 'title slug price currency location status gallery' },
        { path: 'customerId', select: 'fullName email phone portalStatus' },
        { path: 'assignedAgentId', select: 'fullName email' },
      ],
      sort: { createdAt: -1 },
    });

    return NextResponse.json({
      success: true,
      deals: result.items,
      pagination: {
        total: result.totalItems,
        page: result.currentPage,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in GET /api/deals:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch deals.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'deal.create')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to create deals.', 403);
    }

    const body = await request.json();
    if (!body.title || !body.propertyId || !body.customerId || body.dealValue === undefined) {
      return standardError(
        'VALIDATION_ERROR',
        'Title, propertyId, customerId, and dealValue are required.',
        422
      );
    }

    const deal = await DealService.createDeal(body, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'deal.created',
      resourceType: 'deal',
      resourceId: deal._id.toString(),
      route: '/api/deals',
      status: 201,
      changes: computeSafeDiff({}, deal.toObject()),
      metadata: {
        title: deal.title,
        dealValue: deal.dealValue,
        currency: deal.currency,
        propertyId: body.propertyId,
        customerId: body.customerId,
      },
    });

    return NextResponse.json({ success: true, deal }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/deals:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to create deal.', 400);
  }
}
