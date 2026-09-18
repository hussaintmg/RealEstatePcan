import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { PaymentService } from '@/lib/services/paymentService';
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

    if (!can(user, role, 'invoice.record_payment')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to refund/reverse payments.', 403);
    }

    const body = await request.json();
    const reason = body.reason || 'Manual reversal';

    const payment = await PaymentService.reversePayment(params.id, reason, user.userId);

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/payments/[id]/refund:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to refund payment.', 400);
  }
}
