import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { CustomerService } from '@/lib/services/customerService';
import { recordAuditEvent } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'customer.edit')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to issue portal invitations.', 403);
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return standardError('INVALID_ID', 'Invalid customer ID format', 400);
    }

    const { token, expiresAt } = await CustomerService.generatePortalInvitation(params.id, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'portal.invited',
      resourceType: 'customer',
      resourceId: params.id,
      route: `/api/customers/${params.id}/invite`,
      status: 200,
      metadata: { customerId: params.id, expiresAt },
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      inviteUrl: `/portal/activate?token=${token}`,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/customers/[id]/invite:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to issue portal invite.', 400);
  }
}
