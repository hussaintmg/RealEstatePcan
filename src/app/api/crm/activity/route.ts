import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { ConversationService } from '@/lib/services/conversationService';
import { CrmRelatedType, CrmActivityType } from '@/models/CrmActivity';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user } = authRes;

    const { searchParams } = new URL(request.url);
    const relatedType = searchParams.get('relatedType') as CrmRelatedType;
    const relatedId = searchParams.get('relatedId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const requestedVisibility = searchParams.get('visibility') as 'internal' | 'customer_facing' | null;

    if (!relatedType || !relatedId) {
      return standardError('VALIDATION_ERROR', 'relatedType and relatedId are required query parameters.', 422);
    }

    // Portal users are strictly limited to customer_facing activities
    const visibility = user.isDeveloper || user.isOwner || user.roleId
      ? (requestedVisibility || undefined)
      : 'customer_facing';

    const timeline = await ConversationService.getEntityTimeline(relatedType, relatedId, {
      visibility,
      limit,
    });

    return NextResponse.json({ success: true, timeline });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in GET /api/crm/activity:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch activity timeline.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user } = authRes;

    const body = await request.json();
    if (!body.relatedType || !body.relatedId || !body.title || !body.content) {
      return standardError(
        'VALIDATION_ERROR',
        'relatedType, relatedId, title, and content are required.',
        422
      );
    }

    const activity = await ConversationService.logActivity({
      relatedType: body.relatedType as CrmRelatedType,
      relatedId: body.relatedId,
      type: (body.type as CrmActivityType) || 'internal_note',
      title: body.title.trim(),
      content: body.content.trim(),
      authorId: user.userId,
      visibility: body.visibility === 'customer_facing' ? 'customer_facing' : 'internal',
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/crm/activity:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to record activity.', 400);
  }
}
