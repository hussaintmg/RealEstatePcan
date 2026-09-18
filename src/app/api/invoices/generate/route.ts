import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { InvoiceService } from '@/lib/services/invoiceService';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    // Generating an invoice is an authorized action
    if (!can(user, role, 'invoice.list') && !can(user, role, 'deal.edit')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to issue invoices.', 403);
    }

    const body = await request.json();
    if (!body.dealId || body.milestoneIndex === undefined) {
      return standardError('VALIDATION_ERROR', 'dealId and milestoneIndex are required.', 422);
    }

    const invoice = await InvoiceService.generateInvoiceForMilestone(
      body.dealId,
      body.milestoneIndex,
      user.userId
    );

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'invoice.issued',
      resourceType: 'invoice',
      resourceId: invoice._id.toString(),
      route: '/api/invoices/generate',
      status: 201,
      changes: computeSafeDiff({}, invoice.toObject()),
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        dealId: body.dealId,
        amount: invoice.amount,
      },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/invoices/generate:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to generate invoice for milestone.', 400);
  }
}
