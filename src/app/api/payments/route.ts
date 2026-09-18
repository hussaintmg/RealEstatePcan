import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can, applyDataScope } from '@/lib/rbac';
import { Payment } from '@/models/Payment';
import { PaymentService } from '@/lib/services/paymentService';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'invoice.view')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to view payments ledger.', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const invoiceId = searchParams.get('invoiceId') || '';
    const customerId = searchParams.get('customerId') || '';
    const dealId = searchParams.get('dealId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    let baseFilter: Record<string, any> = {};

    if (invoiceId) baseFilter.invoiceId = invoiceId;
    if (customerId) baseFilter.customerId = customerId;
    if (dealId) baseFilter.dealId = dealId;
    if (status) baseFilter.status = status;
    if (search.trim()) {
      baseFilter.transactionReference = { $regex: search.trim(), $options: 'i' };
    }

    const scopedFilter = await applyDataScope(baseFilter, user, role, 'invoice.view');

    const result = await paginateQuery(Payment, {
      page,
      limit,
      filter: scopedFilter,
      populate: [
        { path: 'invoiceId', select: 'invoiceNumber amount balance status dueDate milestoneTitle' },
        { path: 'customerId', select: 'fullName email phone' },
        { path: 'dealId', select: 'title agreedPrice currency' },
        { path: 'createdBy', select: 'fullName email' },
      ],
      sort: { paidAt: -1, createdAt: -1 },
    });

    return NextResponse.json({
      success: true,
      payments: result.items,
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
    console.error('Error in GET /api/payments:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch payments.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'invoice.record_payment')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to record payments.', 403);
    }

    const body = await request.json();
    if (!body.invoiceId || body.amount === undefined || body.amount <= 0) {
      return standardError('VALIDATION_ERROR', 'A valid invoiceId and positive amount are required.', 422);
    }

    const payment = await PaymentService.recordPayment(body, user.userId);

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/payments:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to record payment.', 400);
  }
}
