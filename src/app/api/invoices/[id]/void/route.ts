import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { InvoiceService } from '@/lib/services/invoiceService';
import { recordAuditEvent } from '@/lib/auditLogger';
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

    if (!can(user, role, 'invoice.void')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to void invoices.', 403);
    }

    const body = await request.json();
    const reason = body.reason?.trim() || 'Voided by administrative authority';

    const invoice = await InvoiceService.voidInvoice(params.id, reason, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'invoice.voided',
      resourceType: 'invoice',
      resourceId: params.id,
      route: `/api/invoices/${params.id}/void`,
      status: 200,
      metadata: { invoiceId: params.id, invoiceNumber: invoice.invoiceNumber, reason },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/invoices/[id]/void:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to void invoice.', 400);
  }
}
